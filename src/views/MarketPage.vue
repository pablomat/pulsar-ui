<template>
  <div>
    <b-modal ref="modalProduct" hide-footer>
      <template slot="modal-title">
        <div class="stamp"><img src="../assets/logo-white.png" /></div> AEGIS Blockchain Certificate
      </template>
      <div class="text-center row">
        <img :src="currentProd.image" class="col-12"/>
      </div>
      <h3>{{currentProd.name}}</h3>
      <p class="mt-2 mb-3 text-justify"><strong>Description: </strong>{{currentProd.description}}</p>
      <div class="form-group row">
        <label class="form-label col-4">Issuer</label>
        <div class="col">@{{currentProd.issuer}}</div>
      </div>
      <div class="form-group row">
        <label class="form-label col-4">Product class</label>
        <div class="col">{{currentProd.product_class}}</div>
      </div>
      <div class="form-group row">
        <label class="form-label col-4">License Type</label>
        <div class="col">{{currentProd.license_type}}</div>
      </div>
      <div class="form-group row">
        <label class="form-label col-4">Category</label>
        <div class="col">{{currentProd.category}}</div>
      </div>
      <div class="form-group row">
        <label class="form-label col-4">Price</label>
        <div class="col">{{currentProd.price}}</div>
      </div>
      <div class="form-group row">
        <label class="form-label col-4">Hash [Unique identifier]</label>
        <div class="col-8 text-break">{{currentProd.hash}}</div>
      </div>
      <button class="btn btn-primary mb-3" v-if="!currentProd.free" @click="buy(currentProd)" :disabled="sending"><div v-if="sending" class="mini loader"></div>buy</button>
      <div v-if="alertProduct.danger"  class="alert alert-danger" role="alert">{{alertProduct.dangerText}}</div>
      <div v-if="alertProduct.info" class="alert alert-info" role="alert">{{alertProduct.infoText}}</div>
    </b-modal>


    <HeaderEFTG ref="headerEFTG" v-on:login="changeLogin" v-on:logout="changeLogin"></HeaderEFTG>
    <div class="container">
      <h2>Search products</h2>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">ISSUER</label>
        <div class="col-md-8">
          <input class="form-control" type="text" id="input_issuer"
            v-model="issuer" placeholder="Product"/>
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary" @click="filter" :disabled="sending"><div v-if="sending" class="mini loader"></div>Search</button>
        </div>
      </div>
      <div class="card mb-4">
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <div class="row"
              ><div class="col-md-2"><strong>Issuer</strong></div
              ><div class="col-md-3"><strong>Product</strong></div
              ><div class="col-md-2"><strong>Class</strong></div
              ><div class="col-md-2"><strong>Category</strong></div
              ><div class="col-md-1"><strong>License type</strong></div
              ><div class="col-md-2"><strong>Price</strong></div
            ></div>
          </li>
          <li v-for="(product,index) in products" class="list-group-item" :key="index" @click="selectProduct(index)">
            <div class="row"
              ><div class="col-md-2">{{product.issuer_name}}</div
              ><div class="col-md-3">{{product.name}}</div
              ><div class="col-md-2">{{product.product_class}}</div
              ><div class="col-md-2">{{product.category}}</div
              ><div class="col-md-1">{{product.license_type}}</div
              ><div class="col-md-2">{{product.price}}</div
            ></div>
          </li>
        </ul>
      </div>
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
  name: 'SearchPage',
  data() {
    return {
      products: [],
      currentProd: {
        issuer: '',
        issuer_name: '',
        name: '',
        image: '',
        price: '',
        license_type: '',
        product_class: '',
        category: '',
        description: '',
        hash: '',
        free: false
      },
      issuer: '',
      sending: false,
      owners: ['initminer','owner1'],
      alertProduct: {
        danger: false,
        info: false,
        dangerText: '',
        infoText: '',
      }
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
    this.loadProducts()
  },

  methods: {
    async loadProducts(){
      this.hideSuccess()
      this.hideDanger()

      var products = []
      try{
        var owners = await this.steem_database_call('lookup_owners',['',100])
        owners.push('demo')
        console.log('owners')
        console.log(owners)
        for(var i in owners){
          var owner_products = await this.getProductsByOwner(owners[i])
          owner_products.forEach( (prod)=>{ products.push(prod) })
        }
        var owner_accounts = await this.steem_database_call('get_accounts',[owners])
        products.forEach( (prod)=>{
          var owner_acc = owner_accounts.find( (o)=>{ return o.name === prod.issuer })
          if(!owner_acc) return
          try{
            var metadata = JSON.parse(owner_acc.json_metadata)
            prod.issuer_name = metadata.profile.name
          }catch(err){
            console.log(`Problems reading the metadata of owner @${prod.issuer}`)
          } 
        })
      }catch(error){
        this.showDanger(error.message)
        console.log(error)
      }
      this.products = products
    },

    selectProduct(index){
      this.currentProd = this.products[index]
      this.$refs.modalProduct.show()
    },

    async getProductsByOwner(owner){
      var products = []
      try{
        var owner_posts = await this.steem_database_call('get_discussions_by_blog',[{tag:owner, limit:50}])
        owner_posts.forEach( (p)=>{
          if(!p.json_metadata || p.json_metadata.length==0) return
          var metadata = JSON.parse(p.json_metadata)
          if(metadata.product && metadata.description && metadata.tags.find((t)=>{return t===Config.TAG_PRODUCT})){
            products.push({
              issuer: p.author,
              issuer_name: p.author,
              name: metadata.product,
              image: metadata.image,
              price: metadata.price,
              license_type: metadata.license_type,
              product_class: metadata.product_class,
              category: metadata.category,
              description: metadata.description,
              hash: metadata.hash,
              free: parseFloat(metadata.price) == 0
            })
          }
        })
      }catch(error){console.log(error)}
      return products
    },

    async filter() {
      this.products = await this.getProductsByOwner(this.issuer)
    },

    async buy(product) {
      this.hideSuccess()
      this.hideDanger()
      this.hideInfo()

      this.alertProduct.danger = false
      this.alertProduct.info = false
      if(!this.$store.state.auth.logged || this.$store.state.auth.keys.active == null){
        this.alertProduct.danger = true
        this.alertProduct.dangerText = 'Please login with the active key'
        return
      }
      this.sending = true
      try{
        var operation = [
          'transfer',
          {
            from: this.$store.state.auth.user,
            to: product.issuer,
            amount: product.price,
            memo: product.name
          }
        ]
        var ack = await this.steem_broadcast_sendOperations([operation], this.$store.state.auth.keys.active)
        this.alertProduct.info = true
        this.alertProduct.infoText = 'Transfer done. waiting confirmation...'
        var ack2 = await this.waitPaymentConfirmation(ack, product)
        this.showSuccess(`<a href="${Config.EXPLORER}b/${ack2.block_num}/${ack2.id}">Purchase confirmed</a>`)
        this.$refs.modalProduct.hide()
        this.alertProduct.info = false
        this.sending = false
      }catch(error){
        this.alertProduct.danger = true
        this.alertProduct.dangerText = error.message
        this.sending = false
        throw error
      }
    },

    async waitPaymentConfirmation(ack, product) {
      var block_num = ack.block_num
      var trx_id = null
      
      const delay = (duration) => new Promise(resolve => setTimeout(resolve, duration));

      var confirmation = null
      for(var i=0; i<6; i++){
        var block = await this.steem_database_call('get_block',[block_num])
        if(!block){
          console.log(`block @{block_num} does not exist yet. Waiting 3 seconds`)
        }else{
          block.transactions.forEach( (trx, index)=>{
            trx.operations.forEach( (op)=>{
              // console.log('Operation found')
              if(op[0] !== 'custom_json') return
              // console.log('Is custom json')
              if(op[1].required_posting_auths[0] !== product.issuer) return
              // console.log('Posting auths correct')
              if(op[1].id !== Config.CONFIRMATION_PAYMENT_ID_NAME) return
              // console.log('Correct id')
              var data = JSON.parse(op[1].json)
              // console.log(`json: ${op[1].json}`)
              if(data.buyer === this.$store.state.auth.user){
                // console.log('correct buyer')
                confirmation = op
                trx_id = block.transaction_ids[index]
              }
            })
          })
          if(confirmation) break
          block_num++
        }
        await delay(3000)
      }
      if(!confirmation)
        throw new Error('No confirmation from the issuer')
      return {block_num:block_num, id:trx_id}
    },

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

<style scoped>
.stamp {
  height: 3rem;
  display: inline-block;
  margin-right: 13px;
}

.stamp img {
  max-width: 100%;
  max-height: 100%;
  background: #21294c;
  display: inline-block;
  padding: 5px;
  border-radius: 50%;
}
</style>