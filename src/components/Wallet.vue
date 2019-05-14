<template>
  <div>
    <HeaderEFTG :showAuth="true" ref="headerEFTG" v-on:login="onLogin" v-on:logout="onLogout"></HeaderEFTG>
    <div class="container">
      <div v-if="exists.account">
        <h1><strong>@{{account.name}}</strong></h1>
        <h2>Wallet</h2>
        <div class="row mb-2">
          <div class="col-md-3">EFTG Balance</div>
          <div class="col-md-9">{{account.balance}}</div>
        </div>
        <div class="row mb-2">
          <div class="col-md-3">EUR Balance</div>
          <div class="col-md-9">{{account.sbd_balance}}</div>
        </div>
        <div class="row mb-2">
          <div class="col-md-3">EFTG-Power Balance</div>
          <div class="col-md-9">{{steem_power}}</div>
        </div>
        <div class="row mb-2" v-if="exists.owner">
          <div class="col-md-3">Backed EUR</div>
          <div class="col-md-9">{{owner.backed_sbd}}</div>
        </div>
        <div v-if="true" class="mt-5">
          <h2>EUR creation</h2>
          <div class="form-group row">
            <label for="input_op_id" class="col-md-3 col-form-label">TYPE OPERATION</label>
            <div class="col-md-3">
              <select class="form-control" id="input_op_id" v-model="op_id">
                <option v-for="(op,index) in operations" :value="index">{{op.name}}</option>
              </select>
            </div>
          </div>
          <div class="form-group row" v-if="operations[op_id].operation === 'transfer'">
            <label for="input_amount" class="col-md-3 col-form-label">TO</label>
            <div class="col-md-3">
              <input class="form-control" type="text" id="input_to" 
                     v-model="to" placeholder="account"/>
            </div>
          </div>
          <div class="form-group row">
            <label for="input_amount" class="col-md-3 col-form-label">AMOUNT</label>
            <div class="col-md-3">
              <input class="form-control" type="text" id="input_amount" 
                     v-model="amount" placeholder="0.000 EUR"/>
            </div>
          </div>
          <div class="form-group row">
            <label for="input_memo" class="col-md-3 col-form-label">MEMO</label>
            <div class="col-md-3">
              <input class="form-control" type="text" id="input_memo" 
                     v-model="memo" placeholder="Memo"/>
            </div>
          </div>
          <div class="form-group align-bottom" style="padding-top: 8px;">
            <button @click="walletOperation" class="btn btn-primary btn-large mr-2" :disabled="sending"><div v-if="sending" class="mini loader"></div>{{operations[op_id].name}}</button>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="loader"></div>
      </div>

      <div v-if="alert.info" class="alert alert-info" role="alert">{{alert.infoText}}</div>
      <div v-if="alert.success" class="alert alert-success" role="alert" v-html="alert.successText"></div>
      <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
    </div>    
  </div>
</template>

<script>
import debounce from 'lodash.debounce'
import { Client } from 'eftg-dsteem'
import SteemClient from '@/mixins/SteemClient.js'

import Config from '@/config.js'
import Utils from '@/js/utils.js'
import ChainProperties from '@/mixins/ChainProperties.js'
import HeaderEFTG from '@/components/HeaderEFTG'

export default {
  name: "Wallet",
  
  data() {
    return {
      account: null,
      owner: null,
      amount: 0,
      memo: '',
      steem_power: '',
      op_id: 1,
      operations: [
        {
          name: 'Transfer',
          operation: 'transfer',
          success_message: 'Transfer done!'
        },
        {
          name: 'Create EUR',
          operation: 'sbd_create',
          success_message: 'EUR created!'
        },
        {
          name: 'Burn EUR',
          operation: 'sbd_burn',
          success_message: 'EUR burned!'
        }
      ],
      
      exists: {
        account: false,
        owner: false
      },
      sending: false,

      EFTG_HARDFORK_0_1: Config.EFTG_HARDFORK_0_1,
      EXPLORER: Config.EXPLORER,
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
    this.getChainProperties().then( ()=> {
      this.getAccount()
    })
  },

  methods: {
    async getAccount() {
      var name = this.$route.params.account;
            
      console.log('Fetching data for '+name)
      this.exists.account = false
      this.exists.owner = false

      try{
        var result = await this.steem_database_call('get_accounts',[[name]])
        if(result.length == 0) throw new Error('Account @'+name+' does not exists')
        this.account = result[0]
        this.exists.account = true

        var delegated = parseFloat(this.account.received_vesting_shares) - parseFloat(this.account.delegated_vesting_shares)
        this.steem_power = this.vests2sp(this.account.vesting_shares) + ' (' + (delegated>0?'+':'') + this.vests2sp(delegated) + ')'

        result = await this.steem_database_call('get_owners',[[name]])
        if(result.length == 0) {
          console.log('@'+name+' is not an owner')
          return
        }
        this.owner = result[0]
        this.exists.owner = true
      }catch(error){
        this.showDanger(error.message)
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
    
    async walletOperation() {
      this.hideSuccess()
      this.hideDanger()
      this.hideInfo()

      if(!Config.EFTG_HARDFORK_0_1){
        this.showDanger('The current blockchain does not use the hardfork EFGT 0.1')
        return
      }
      var user = this.$store.state.auth.user
      var activeKey = this.$store.state.auth.keys.active
      var ownerKey  = this.$store.state.auth.keys.owner

      if( activeKey != null ) {
        var privKey = activeKey
      }else if(ownerKey != null ) {
        var privKey = ownerKey 
      }else {
        this.showDanger('Please login with master, owner, or active key')
        return        
      }

      var operation_name = this.operations[this.op_id].operation
      var operation = [
        operation_name,
        {
          owner: this.account.name,
          amount: this.amount,
          memo: this.memo
        }
      ]
      if(operation_name === 'transfer'){
        operation[1].from = this.account.name,
        operation[1].to = this.to
      }
          
      var ok_message = (operation_name === 'transfer' ? 
                          'Transfer done!' : 
                          (operation_name === 'sbd_create' ? 'EUR created!' : 'EUR burned!')
                       )

      try{
        this.sending = true  
        var result = await this.steem_broadcast_sendOperations([operation],privKey)
        this.showSuccess('<a href="/explorer/b/'+result.block_num+'/'+result.id+'" class="alert-link" target="_blank">'+ok_message+'</a>')
      }catch(error){
        this.showDanger(error.message)
      }
      this.sending = false

      this.getAccount()
    },
  }
};
</script>

<style scoped>

.image-profile {
  display: inline-block;
  height: 2rem;
  width: 2rem;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  border-radius: 50%;
  vertical-align: middle;
}

</style>
