<template>
  <div>
    <HeaderEFTG :showAuth="true" ref="headerEFTG" v-on:login="onLogin" v-on:logout="onLogout"></HeaderEFTG>
    <div class="container">
      <h2>Barman</h2>
      <b-tabs content-class="mt-3">
        <b-tab title="Open" active>
          <div class="card mb-3" v-for="(ticket, index) in openTickets" @click="selectItem('open', index)">
            <div class="row no-gutters">
              <div class="item-picture" v-bind:style="{ backgroundImage: 'url(' + require('@/assets/menu/'+ticket.picture) + ')' }"></div>
              <div class="col">
                <div class="card-block px-2">
                  <h4 class="card-title">{{ticket.from2}}</h4>
                  <div class="rsow">{{ticket.table}}</div>
                  <div class="rsow">{{ticket.product}}</div>
                  <div class="rsow">{{ticket.fakeAmount}}</div>
                </div>
              </div>
              <div class="col-3 mr-2">
                <div class="text-right">{{ticket.timeAgo}}</div>
                <div v-if="ticket.selected" class="d-flex justify-content-end">
                  <button class="btn btn-primary"
                    @click="moveTicket('close',index)"
                  >Done</button>
                </div>
              </div>
            </div>
          </div>
        </b-tab>
        <b-tab title="Closed">
          <div class="card mb-3" v-for="(ticket, index) in closedTickets" @click="selectItem('closed', index)">
           <div class="row no-gutters">
             <div class="item-picture" v-bind:style="{ backgroundImage: 'url(' + require('@/assets/menu/'+ticket.picture) + ')' }"></div>
             <div class="col">
               <div class="card-block px-2">
                 <h4 class="card-title">{{ticket.from2}}</h4>
                 <div class="rsow">{{ticket.table}}</div>
                 <div class="rsow">{{ticket.product}}</div>
                 <div class="rsow">{{ticket.fakeAmount}}</div>
               </div>
             </div>
             <div class="col-3 mr-2">
               <div class="text-right">{{ticket.timeAgo}}</div>
               <div v-if="ticket.selected" class="d-flex justify-content-end">
                 <button class="btn btn-primary"
                   @click="moveTicket('open',index)"
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
import restaurant from '@/assets/restaurant.json'

export default {
  name: "Barman",
  
  data() {
    return {
      products: restaurant.menu,
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

    _moveTicket(ack) {
      if(ack.id === 'open-ticket') { //ack open
        var from = 'closedTickets'
        var to =   'openTickets'
      }else{
        var from = 'openTickets'
        var to =   'closedTickets'
      }
      var id = this[from].findIndex( (t)=>{ return t.trx_id === ack.trx_id } )
      var tickets = this[from].splice(id, 1)
      var ticket = tickets[0]
      if(ticket) {
        ticket.selected = false
        if(to === 'openTickets')
          this[to].splice(0, 0, ticket )
        else
          this[to].push( ticket ) //end of the list in closed tickets for old requests.
      }else{
        /*console.log('get old transaction...')
        this.getTransaction(ack.block, ack.trx_id)
        .then( ()=>{
          console.log('get old transaction... OK')
        }).catch( (error)=>{
          console.log('error old transaction')
          console.log(error)
        })*/
      }
    },

    async moveTicket(type, id){
      this.hideSuccess()
      this.hideDanger()
      this.hideInfo()
      this.sending = true

      try{
        if (!this.$store.state.auth.logged) {
          this.$refs.headerEFTG.login();
          throw new Error('Please login');
        }
        if (!this.$store.state.auth.keys.posting)
          throw new Error('Please login with your posting or master key')

        var username = this.$store.state.auth.user
        var privKey = this.$store.state.auth.keys.posting

        if(type === 'close')
          var ticket = this.openTickets[id]
        else
          var ticket = this.closedTickets[id]

        var json = {
          transfer: {
            from:   ticket.from,
            to:     ticket.to,
            amount: ticket.amount,
            memo:   ticket.memo
          },
          block: ticket.block,
          trx_id: ticket.trx_id
        }

        var operation = [
          'custom_json',
          {
            required_auths: [],
            required_posting_auths: [username],
            id: type + '-ticket',
            json: JSON.stringify(json)
          }
        ]

        var result = await this.steem_broadcast_sendOperations([operation], privKey)
        this.showSuccess('<a href="'+Config.EXPLORER+'b/'+result.block_num+'/'+result.id+'" class="alert-link" target="_blank">Ticket moved</a>')
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
      this.hideInfo()
      this.sending = false
    },

    selectItem(type, index) {
      switch(type) {
        case 'open':
          this.openTickets.forEach( (t) => { t.selected = false } )
          var ticket = this.openTickets[index]
          if( ticket ){
            ticket.selected = true
            this.$set(this.openTickets, index, ticket)
          }
          break
        case 'closed':
          this.closedTickets.forEach( (t) => { t.selected = false } )
          var ticket = this.closedTickets[index]
          if( ticket ){
            ticket.selected = true
            this.$set(this.closedTickets, index, ticket)
          }
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
        var acknowledge = this.getAck(trx)
        if(acknowledge) this._moveTicket(acknowledge)
      }
    },

    getTicket(trx) {
      //TODO: search more operations in 1 transaction
      if( trx.operations[0][0] !== 'transfer') return null
      if( trx.operations[0][1].to !== Config.RESTAURANT_STEEM_ACCOUNT ) return null
      var memo = trx.operations[0][1].memo.split('***')
      if(memo.length != 2){ //3){
        console.log('Transfer with different format: ')
        console.log(trx.operations[0][1])
        return null
      }

      var fakeAmount = (parseFloat(trx.operations[0][1].amount)*100).toFixed(0) + ' EUR'
      var picture = ''

      var product = this.products.find( (p)=>{ return memo[0] === p.product} )
      if(product) picture = product.picture

      console.log('Ticket found: '+trx.operations[0][1].memo)
      return {
        from: trx.operations[0][1].from,
        to: trx.operations[0][1].to,
        amount: trx.operations[0][1].amount,
        memo: trx.operations[0][1].memo,
        table: memo[1],
        from2: trx.operations[0][1].from, //memo[2],
        fakeAmount: fakeAmount,
        product: memo[0],
        picture: picture,
        time: trx.timestamp,
        trx_id: trx.transaction_id,
        block: trx.block_num,
        num_op: 0,//trx.op_in_trx, //TODO: when get_block search number op
        selected: false
      }
    },

    getAck(trx) {
      if( trx.operations[0][0] !== 'custom_json') return null
      if( trx.operations[0][1].required_posting_auths[0] !== Config.RESTAURANT_STEEM_ACCOUNT ) return null
      var ack = JSON.parse(trx.operations[0][1].json)
      ack.id = trx.operations[0][1].id
      return ack
    },

    async loadLastBlocks() {
      while(true){
        try {
          var dgp = await this.steem_database_call('get_dynamic_global_properties')
          if(this.lastBlock == 0)
            this.lastBlock = dgp.head_block_number - 22 //two rounds back from head
          if(this.lastBlock == dgp.head_block_number)
            break
        }catch(error){
          console.log('Error getting dynamic global properties')
          console.log(error)
          return
        }
      
        while(this.lastBlock < dgp.head_block_number)
          await this.getBlock()
      }
      
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
          var acknowledge = this.getAck(result.transactions[i])
          if(acknowledge) {
            this._moveTicket(acknowledge)
          }
        }
        this.lastBlock++
      }catch(error){
        console.log('Error getting block '+(this.lastBlock+1))
        console.log(error)
      }
    },

    async getTransaction(block, trx_id) {
      try{
        var result = await this.steem_database_call('get_block',[block])
        var trx = result.transactions.find( (t)=>{ return t.transaction_id === trx_id } )
        if(trx)
          this.getTicket(trx)
        else
          console.log('Error trying to find transaction '+trx_id+' in the block '+block)
      }catch(error){
        console.log('Error getting transaction in block '+block)
        console.log(error)
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
