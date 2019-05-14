<template>
  <div>
    <HeaderEFTG :showAuth="true" ref="headerEFTG" v-on:login="onLogin" v-on:logout="onLogout"></HeaderEFTG>
    <div class="container">
      <h2>Barman</h2>
      <b-tabs content-class="mt-3">
        <b-tab title="Open" active>
          <div class="card mb-3" v-for="(ticket, index) in openTickets" @click="selectItem('open', index)">
            <div class="row no-gutters">
              <div class="item-picture" v-bind:style="{ backgroundImage: 'url(' + ticket.imageProduct + ')' }"></div>
              <div class="col">
                <div class="card-block px-2">
                  <h4 class="card-title">@{{ticket.from2}}</h4>
                  <div class="rsow">{{ticket.table}}</div>
                  <div class="rsow">{{ticket.product}}</div>
                  <div class="rsow">{{ticket.fakeAmount}}</div>
                </div>
              </div>
              <div class="col-3 mr-2">
                <div class="text-right">{{ticket.timeAgo}}</div>
                <div v-if="ticket.selected" class="d-flex justify-content-end">
                  <button class="btn btn-primary"
                    @click="closeTicket(index)"
                  >Done</button>
                </div>
              </div>
            </div>
          </div>
        </b-tab>
        <b-tab title="Closed">
          <div class="card mb-3" v-for="(ticket, index) in closedTickets" @click="selectItem('closed', index)">
           <div class="row no-gutters">
             <div class="item-picture" v-bind:style="{ backgroundImage: 'url(' + ticket.imageProduct + ')' }"></div>
             <div class="col">
               <div class="card-block px-2">
                 <h4 class="card-title">@{{ticket.from2}}</h4>
                 <div class="rsow">{{ticket.table}}</div>
                 <div class="rsow">{{ticket.product}}</div>
               </div>
             </div>
             <div class="col-3 mr-2">
               <div class="text-right">{{ticket.timeAgo}}</div>
               <div v-if="ticket.selected" class="d-flex justify-content-end">
                 <button class="btn btn-primary"
                   @click="reopenTicket(index)"
                 >Open again</button>
               </div>
             </div>
           </div>
         </div>
        </b-tab>
      </b-tabs>
      
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

export default {
  name: "Barman",
  
  data() {
    return {
      products: [
        {
          product: 'Beer 1',
          imageProduct: 'https://res.cloudinary.com/ratebeer/image/upload/w_150,h_300,c_pad,d_beer_img_default.png,f_auto/beer_9410',
          price: '5 EUR',
          selected: false
        },
        {
          product: 'Wine 123',
          imageProduct: 'https://www.vilaviniteca.es/media/catalog/product/cache/3/image/9df78eab33525d08d6e5fb8d27136e95/0/1/015792.jpg',
          price: '7 EUR',
          selected: false
        },
        {
          product: 'Cocktail premium',
          imageProduct: 'http://www.domainehudson.com/wp-content/uploads/2015/06/header-cocktail.jpg',
          price: '9 EUR',
          selected: false
        },
      ],
      openTickets: [],
      closedTickets: [],
      lastBlock: 0,
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
    setInterval( this.refreshTimers, 1000 )
    this.loadHistory().then( this.loadLastBlocks )
  },
  
  methods: {
    
    refreshTimers() {
      for(var i in this.openTickets){
        var ticket = this.openTickets[i]
        ticket.timeAgo = Utils.textTimeAgo( Date.now() - new Date(this.openTickets[i].time + 'Z') )
        this.$set(this.openTickets, i, ticket ) 
      }

      for(var i in this.closedTickets){
        var ticket = this.closedTickets[i]
        ticket.timeAgo = Utils.textTimeAgo( Date.now() - new Date(this.closedTickets[i].time + 'Z') )
        this.$set(this.closedTickets, i, ticket ) 
      }
    },

    closeTicket(id){
      var tickets = this.openTickets.splice(id, 1)
      var ticket = tickets[0]
      ticket.selected = false
      this.closedTickets.splice(0, 0, ticket )       
    },

    reopenTicket(id){
      var tickets = this.closedTickets.splice(id, 1)
      var ticket = tickets[0]
      ticket.selected = false
      this.openTickets.splice(0, 0, ticket )
    },

    selectItem(type, index) {
      switch(type) {
        case 'open':
          this.openTickets.forEach( (t) => { t.selected = false } )
          var ticket = this.openTickets[index]
          if( ticket ) ticket.selected = true
          break
        case 'closed':
          this.closedTickets.forEach( (t) => { t.selected = false } )
          var ticket = this.closedTickets[index]
          if( ticket ) ticket.selected = true
          break
        default:
          break
      }
    },

    async loadHistory() {
      var history = await this.steem_database_call('get_account_history',[Config.RESTAURANT_STEEM_ACCOUNT, -1, 250])
      var iniDate = new Date(Date.now() - 24*60*60*1000)

      var index = history.findIndex( (a) => { return new Date(a[1].timestamp) >= iniDate } )
      if(index < 0){
        console.log('No history in the last 24 hours')
        return
      }

      history.splice(0, index) // removing old history
      console.log(history)
      for(var i in history) {
        var trx = {
          operations: [
            history[i][1].op
          ],
          transaction_id: history[i][1].trx_id,
          block_num: history[i][1].block,
          num_op: history[i][1].op_in_trx,
          timestamp: history[i][1].timestamp
        }
        var ticket = this.getTicket(trx)
        if(ticket) this.openTickets.push(ticket)
      }
    },

    getTicket(trx) {
      //TODO: search more operations in 1 transaction
      if( trx.operations[0][0] !== 'transfer' ) return null
      if( trx.operations[0][1].to !== Config.RESTAURANT_STEEM_ACCOUNT ) return null
      var memo = trx.operations[0][1].memo.split('***')
      if(memo.length != 3){
        console.log('Transfer with different format: ')
        console.log(trx.operations[0][1])
        return null
      }

      var fakeAmount = (parseFloat(trx.operations[0][1].amount)*1000).toFixed(0) + ' EUR'
      var imageProduct = ''

      var product = this.products.find( (p)=>{ return memo[0] === p.product} )
      if(product) imageProduct = product.imageProduct

      console.log('Ticket found: '+trx.operations[0][1].memo)
      return {
        from: trx.operations[0][1].from,
        to: trx.operations[0][1].to,
        amount: trx.operations[0][1].amount,
        memo: trx.operations[0][1].memo,
        table: memo[1],
        from2: memo[2],
        fakeAmount: fakeAmount,
        product: memo[0],
        imageProduct: imageProduct,
        time: trx.timestamp,
        trx_id: trx.trx_id,
        num_op: trx.op_in_trx,
        selected: false
      }
    },

    async loadLastBlocks() {
      try {
        var dgp = await this.steem_database_call('get_dynamic_global_properties')
        this.lastBlock = dgp.head_block_number - 22 //two rounds back from head
      }catch(error){
        console.log('Error getting dynamic global properties')
        console.log(error)
        return
      }
      
      while(this.lastBlock <= dgp.head_block_number)
        await this.getBlock()
      
      setInterval( this.getBlock , 3000 )
    },

    async getBlock() {
      try{
        var result = await this.steem_database_call('get_block',[this.lastBlock +1])
        for(var i in result.transactions){
          var ticket = this.getTicket(result.transactions[i])
          if(ticket) {
            ticket.time = result.timestamp
            this.openTickets.push(ticket)
          }
        }
        this.lastBlock++
      }catch(error){
        console.log('Error getting block '+(this.lastBlock+1))
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
/*  height: 7rem;
  width: 7rem;
  display: inline-block;
  vertical-align: top;
  margin-right: 15px; */
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
