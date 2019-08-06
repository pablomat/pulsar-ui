<template>
  <div>
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
      <table class="table mb-4">
        <thead>
          <tr class="table-primary">
            <th scope="col">Issuer</th>
            <th scope="col">Product</th>
            <th scope="col">Price</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(product,index) in products" :key="index" :value="index">
            <td>@{{product.issuer}}</td>
            <td>{{product.name}}</td>
            <td>{{product.price}}</td>
            <td><button class="btn btn-primary" @click="buy(index)" :disabled="product.buying">BUY</button></td>
          </tr>
        </tbody>
      </table>
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
      issuer: '',
      sending: false,
      owners: ['initminer','owner1'],
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
        console.log('owners')
        console.log(owners)
        for(var i in owners){
          var owner_products = await this.getProductsByOwner(owners[i])
          owner_products.forEach( (prod)=>{ products.push(prod) } )
          products.forEach( (prod)=>{ prod.buying = false })
        }        
      }catch(error){
        this.showDanger(error.message)
        throw error
      }
      this.products = products
    },

    async getProductsByOwner(owner){
      var products = []
      try{
        var owner_posts = await this.steem_database_call('get_discussions_by_blog',[{tag:owner, limit:50}])
        owner_posts.forEach( (p)=>{
          if(!p.json_metadata || p.json_metadata.length==0) return
          var metadata = JSON.parse(p.json_metadata)
          if(metadata.product && metadata.description){
            products.push({
              issuer: p.author,
              name: metadata.product,
              price: metadata.price,
              description: metadata.description
            })
          }
        })
      }catch(error){console.log(error)}
      return products
    },

    async filter() {
      this.products = await this.getProductsByOwner(this.issuer)
    },

    async buy(index) {
      this.hideSuccess()
      this.hideDanger()
      this.hideInfo()
      if(!this.$store.state.auth.logged || this.$store.state.auth.keys.active == null){
        this.showDanger('Please login with the active key')
        return
      }
      var product = this.products[index]
      product.buying = true
      this.$set(this.products, index, product)
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
        this.showSuccess('Transfer done. waiting confirmation...')
        var ack2 = await this.waitPaymentConfirmation(ack, product)
        this.showSuccess(`<a href="@{Config.EXPLORER}/b/@{ack2.block_num}/@{ack2.id}">Purchase confirmed</a>`)
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
      product.buying = false
      this.$set(this.products, index, product)
    },

    async waitPaymentConfirmation(ack, product) {
      var block_num = ack.block_num
      var trx_id = null
      
      const delay = (duration) => new Promise(resolve => setTimeout(resolve, duration));

      var confirmation = null
      for(var i=0; i<5 && !confirmation; i++){
        var block = await this.steem_database_call('get_block',[block_num])
        if(!block){
          console.log(`block @{block_num} does not exist yet. Waiting 3 seconds`)
        }else{
          block.transactions.forEach( (trx, index)=>{
            trx.operations.forEach( (op)=>{
              if(op[0] !== 'custom_json') return
              if(op[1].required_posting_auths[0] !== product.issuer) return
              if(op[1].id !== Config.CONFIRMATION_PAYMENT_ID_NAME) return
              var data = JSON.parse(op[1].json)
              if(data.buyer === this.$store.state.auth.user)
                confirmation = op
                trx_id = block.transaction_ids[index]
            })
          })
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