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
        <label class="col-md-2 col-form-label">IMAGE</label>
        <div class="col-md-10">
          <input class="form-control" type="text" id="input_image"
            v-model="image" placeholder="Url"/>
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
      description: '',
      sending: false,
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

        var metadata = {
          tags: [],
          product: this.product,
          image: this.image,
          description: this.description
        }

        var operation = [
          'comment',
          {
            author: username,
            body: `![product](${this.image})\n\n${this.description}`,
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
    changeLogin(){
      this.showPage = this.$store.state.auth.isOwner
    }
  }
}
</script>