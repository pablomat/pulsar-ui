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
      <div class="form-group row">
        <label class="col-md-2 col-form-label">FILE</label>
        <div class="col-md-10">
          <div class="custom-file">            
            <input type="file" class="custom-file-input" id="input_file">
            <label class="custom-file-label" for="input_file">Choose file...</label>          
          </div>
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
import {cryptoUtils} from 'eftg-dsteem'
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
  mounted(){
    this.startEventListenerFile()
  },
  methods: {
    async publish(){
      this.sending = true
      this.hideSuccess()
      this.hideDanger()

      if(!this.$store.state.auth.logged || this.$store.state.auth.keys.posting == null){
        this.showDanger('Please login with the posting key')
        return
      }

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
          hash: await this.getHashFile()
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

    async getHashFile() {
      let self = this
      var localFile = document.getElementById("input_file").files[0];
      var fileData = await this.readFileAsBuffer(localFile,{
        onProgress: function(progressEvent){
          var loaded = progressEvent.loaded
          var total = progressEvent.total
          self.showInfo('Reading file '+Math.floor(loaded*100/total)+'%')            
        }
      });
      console.log(cryptoUtils.sha256(fileData).toString('hex'))
      return cryptoUtils.sha256(fileData).toString('hex')
    },

    async readFileAsBuffer(inputFile, config) {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onerror = () => {
          reader.abort();
          reject(new DOMException("Problem parsing file to upload"));
        };
        reader.onload = () => {
          if(config.onLoad) config.onLoad()
        
          //the result is an ArrayBuffer, we change it to Buffer.
          //this is important because the hash using 'crypto' is different in the 2 cases
          //TODO: [es-lint] says that Buffer is not defined, however it works
          var dataArrayBuffer = reader.result;
          var dataBuffer = new Buffer(dataArrayBuffer);
          resolve(dataBuffer);
        };
        
        if(config.onProgress)  reader.onprogress  = config.onProgress
        if(config.onAbort)     reader.onabort     = config.onAbort
        if(config.onError)     reader.onerror     = config.onError
        if(config.onLoadStart) reader.onloadstart = config.onLoadStart
        if(config.onLoadEnd)   reader.onloadend   = config.onLoadEnd 
        
        reader.readAsArrayBuffer(inputFile);
      });
    },

    startEventListenerFile() {
      var input = document.getElementById("input_file")
      var label = input.nextElementSibling
      var labelVal = label.innerHTML
      input.addEventListener("change", function(e) {
        var fileName = e.target.value.split("\\").pop()
        if (fileName) label.innerHTML = fileName
        else label.innerHTML = labelVal
      })
    },

    changeLogin(){
      this.showPage = this.$store.state.auth.isOwner
    }
  }
}
</script>