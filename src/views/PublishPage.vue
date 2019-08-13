<template>
  <div>
    <HeaderEFTG ref="headerEFTG" v-on:login="changeLogin" v-on:logout="changeLogin"></HeaderEFTG>
    <div class="container">
      <h2>Publish</h2>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">PRODUCT</label>
        <div class="col-md-10">
          <input class="form-control" type="text" id="input_product"
            v-model="product" placeholder="Product"/>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">ICON</label>
        <div class="col-md-10">
          <input class="form-control" type="text" id="input_image"
            v-model="image" placeholder="Image url"/>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">CLASS</label>
        <div class="col-md-10">
          <select class="form-control" v-model="product_class">
            <option v-for="(item,index) in PRODUCT_CLASS_LIST" :key="index" :value="item">
              {{item}}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">LICENSE TYPE</label>
        <div class="col-md-10">
          <select class="form-control" v-model="product_license_type">
            <option v-for="(item,index) in PRODUCT_LICENSE_TYPE_LIST" :key="index" :value="item">
              {{item}}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">CATEGORY</label>
        <div class="col-md-10">
          <select class="form-control" v-model="product_category">
            <option v-for="(item,index) in PRODUCT_CATEGORY_LIST" :key="index" :value="item">
              {{item}}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">PRICE</label>
        <div class="col-md-10">
          <input class="form-control" type="text" id="input_price"
            v-model="price" placeholder="Price"/>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">DESCRIPTION</label>
        <div class="col-md-10">
          <textarea class="form-control" id="input_description"
            v-model="description" rows="5"/>
        </div>
      </div>
      <button class="btn btn-primary btn-large mb-4" @click="publish" :disabled="sending"><div v-if="sending" class="mini loader"></div>Publish</button>
      <div v-if="alert.info" class="alert alert-info" role="alert">{{alert.infoText}}</div>
      <div v-if="alert.success" class="alert alert-success" role="alert" v-html="alert.successText"></div>
      <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
    </div>
  </div>
</template>

<script>
import Config from '@/config.js'
import Utils from '@/js/utils.js'
import SteemClient from '@/mixins/SteemClient.js'
import HeaderEFTG from '@/components/HeaderEFTG'
import Alerts from '@/mixins/Alerts.js'
 
export default{
  name: 'PublishPage',
  data() {
    return {
      showPage: false,
      product: '',
      image: '',
      price: '',
      description: '',
      product_license_type: Config.PRODUCT_LICENSE_TYPE_LIST[0],
      product_class: Config.PRODUCT_CLASS_LIST[0],
      product_category: Config.PRODUCT_CATEGORY_LIST[0],
      sending: false,
      PRODUCT_CLASS_LIST: Config.PRODUCT_CLASS_LIST,
      PRODUCT_LICENSE_TYPE_LIST: Config.PRODUCT_LICENSE_TYPE_LIST,
      PRODUCT_CATEGORY_LIST: Config.PRODUCT_CATEGORY_LIST,
    }
  },
  components: {
    HeaderEFTG
  },
  mixins: [
    Alerts,
    SteemClient
  ],
  created(){
    this.changeLogin()
  },
  methods: {
    async publish(){
      this.sending = true
      this.hideSuccess()
      this.hideDanger()

      try{
        var username = this.$store.state.auth.user
        var permlink = Utils.createPermLink(this.product)

        this.stringToAsset(this.price) // verify correct format

        var metadata = {
          tags: [Config.TAG_PRODUCT],
          product: this.product,
          image: this.image,
          price: this.price.toUpperCase(),
          description: this.description,
          license_type: this.product_license_type,
          product_class: this.product_class,
          category: this.product_category,
        }

        var operation = [
          'comment',
          {
            author: username,
            body: this.description,
            json_metadata: JSON.stringify(metadata),
            parent_author: '',
            parent_permlink: 'product',
            permlink: permlink,
            title: this.product
          }
        ]
        var ack = await this.steem_broadcast_sendOperations([operation], this.$store.state.auth.keys.posting)
        this.showSuccess('<a href="'+Config.EXPLORER+'@'+username+'/'+permlink+'" class="alert-link" target="_blank">Product published!</a>')
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
      this.sending = false
    },

    stringToAsset(data){
      var parts = data.split(' ')
      if(parts.length !== 2)
        throw new Error(`Incorrect price format`)
      var currency = parts[1]
      var precision = parts[0].length - parts[0].indexOf('.') - 1
      var amount = parseInt(parseFloat(parts[0])*Math.pow(10,precision))
      if(currency !== Config.SBD && currency !== Config.STEEM)
        throw new Error(`Incorrect asset type: ${currency}`)

      return {
        amount,
        precision,
        currency
      }
    },

    changeLogin(){
      this.showPage = this.$store.state.auth.isOwner
    }
  }
}
</script>