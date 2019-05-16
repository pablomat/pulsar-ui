<template>
  <div>
    <HeaderEFTG :showAuth="true" ref="headerEFTG" v-on:login="onLogin" v-on:logout="onLogout"></HeaderEFTG>
    <div class="container">
      <h2>Menu</h2>

      <h4 class="text-center">Table</h4>
      <div class="form-group mb-4">
        <select class="form-control" id="input_table" v-model="table">
          <option disabled value="">Select your table</option>
            <option
              v-for="table in tables"
              v-bind:key="table.id"
              v-bind:value="table.name"
            >
              {{ table.name }}
            </option>
        </select>
      </div>

      <div v-for="(product, index) in products">
        <h3 v-if="product.title" class="text-center mt-5">{{product.class}}</h3>
        <div class="card mb-3"  @click="selectItem(index)">
          <div class="row no-gutters">
            <div class="item-picture" v-bind:style="{ backgroundImage: 'url(' + require('@/assets/menu/'+product.picture) + ')' }"></div>
            <div class="col">
              <div class="card-block px-2">
                <h4 class="card-title">{{product.product}}</h4>
                <div>{{product.price}}</div>
              </div>
            </div>
            <div class="col-3 mr-2">
              <div v-if="product.selected" class="d-flex justify-content-end mt-2">
                <button class="btn btn-primary"
                  @click="orderProduct(index)" :disabled="sending"
                ><div v-if="sending" class="mini loader"></div>Order</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="alert.info" class="alert alert-info" role="alert">{{alert.infoText}}</div>
      <div v-if="alert.success" class="alert alert-success" role="alert" v-html="alert.successText"></div>
      <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
    </div>    
  </div>
</template>

<script>
import { Client } from 'dsteem'
import SteemClient from '@/mixins/SteemClient.js'

import Config from '@/config.js'
import Utils from '@/js/utils.js'
import ChainProperties from '@/mixins/ChainProperties.js'
import HeaderEFTG from '@/components/HeaderEFTG'
import restaurant from '@/assets/restaurant.json'

export default {
  name: "Menu",
  
  data() {
    return {
      products: restaurant.menu,

      tables: [
        {
          id: 1,
          name: 'Table 1'
        },
        {
          id: 2,
          name: 'Table 2'
        },
        {
          id: 3,
          name: 'Table 3'
        },
        {
          id: 4,
          name: 'Table 4'
        }
      ],

      table: '',

      restaurant: Config.RESTAURANT_STEEM_ACCOUNT,
      sending: false,
    };
  },
  
  components: {
    HeaderEFTG    
  },

  mixins: [
    ChainProperties,
    SteemClient
  ],

  created() {
    var title = ''
    for(var i in this.products) {
      var product = this.products[i]

      product.title = false
      if( product.class !== title ){
        product.title = true
        title = product.class
      }

      if( product.picture === '' )
        product.picture = 'menu-gray.jpg'

      this.$set(this.products, i, product)
    }
  },

  methods: {

    async orderProduct(id) {
      this.hideSuccess()
      this.hideDanger()
      this.hideInfo()
      this.sending = true

      try{
        if (!this.$store.state.auth.logged) {
          this.$refs.headerEFTG.login();
          throw new Error('Please login');
        }
        if (!this.$store.state.auth.keys.active)
          throw new Error('Please login with your active or master key')
        if (this.table === '')
          throw new Error('Please select a table')

        var username = this.$store.state.auth.user
        var privKey = this.$store.state.auth.keys.active
        var amount = (parseInt( this.products[id].price ) / 100).toFixed(3) + ' SBD'
        var op = [ 
          'transfer',
          {
            from: username,
            to: this.restaurant,
            amount: amount,
            memo: this.products[id].product + '***' + this.table// + '***' + username 
          }
        ]
        var result = await this.steem_broadcast_sendOperations([op], privKey)
        console.log(result)
        this.showSuccess('Thanks for your purchase. Now it is being processed. <a href="'+Config.EXPLORER+result.block_num+'/'+result.id+'" class="alert-link" target="_blank">Ref.</a>')
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
      this.hideInfo()
      this.sending = false
    },

    selectItem(index) {
      this.products.forEach( (t) => { t.selected = false } )
      var ticket = this.products[index]
      if( ticket ){
        ticket.selected = true
        this.$set(this.products, index, ticket)
      }
    },

    onLogin() {
      this.hideSuccess()
      this.hideDanger()
      this.hideInfo()
    },

    onLogout() {
      this.hideSuccess()
      this.hideDanger()
      this.hideInfo()
    },
  }
};
</script>

<style>

.item-picture {
  display: inline-block;
  height: 7rem;
  width: 7rem;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  vertical-align: middle;
}

.item-picture img {
  max-width: 100%;
  max-height: 100%;
}

.item-details {
  display: inline-block;
}

.card:hover {
  background-color: #efefef;
}

</style>

