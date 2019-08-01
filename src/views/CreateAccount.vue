<template>
  <div>
    <HeaderEFTG ref="headerEFTG" v-on:login="changeLogin" v-on:logout="changeLogin"></HeaderEFTG>
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <h2 class="text-center mb-4">Create account in the blockchain</h2>
          <div id="eftg-form" novalidate>
            <div class="form-group row">
              <label for="input_username" class="col-md-2 col-form-label">USERNAME</label>
              <div class="col-md-10">
                <input class="form-control" type="text" id="input_username" v-model="username" placeholder="Username"/>
              </div>
            </div>
            <div class="form-group row">
              <label for="input_name" class="col-md-2 col-form-label">NAME</label>
              <div class="col-md-10">
                <input class="form-control" type="text" id="input_name" v-model="name" placeholder="Name"/>
              </div>
            </div>
            <div class="form-group row">
              <label for="input_about" class="col-md-2 col-form-label">ABOUT</label>
              <div class="col-md-10">
                <input class="form-control" type="text" id="input_about" v-model="about" placeholder="About"/>
              </div>
            </div>
            <div class="form-group row">
              <label for="input_location" class="col-md-2 col-form-label">LOCATION</label>
              <div class="col-md-10">
                <input class="form-control" type="text" id="input_location" v-model="location" placeholder="Location"/>
              </div>
            </div>
            <div class="form-group row">
              <label for="input_profile_image" class="col-md-2 col-form-label">PROFILE IMAGE</label>
              <div class="col-md-10">
                <input class="form-control" type="text" id="input_profile_image" v-model="profile_image" placeholder="Profile image"/>
              </div>
            </div>
            <div class="form-group row">
              <label for="input_cover_image" class="col-md-2 col-form-label">COVER IMAGE</label>
              <div class="col-md-10">
                <input class="form-control" type="text" id="input_cover_image" v-model="cover_image" placeholder="Cover image"/>
              </div>
            </div>
            <div class="row mt-4">
              <div class="form-group col-12 align-bottom" style="padding-top: 8px;">
                <button @click="create" class="btn btn-primary btn-large mr-2" :disabled="sending"><div v-if="sending" class="mini loader"></div>Create</button>
                <button @click="modify" class="btn btn-primary btn-large" :disabled="sending"><div v-if="sending" class="mini loader"></div>Modify</button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <h2 class="text-center mb-4">Upgrade to owner</h2>
          <div class="form-group row">
            <label class="col-md-2 col-form-label">USERNAME</label>
            <div class="col-md-10">
              <input class="form-control" type="text" id="input_username2" v-model="username2" placeholder="Username"/>
            </div>
            <button @click="createOwner" class="btn btn-primary btn-large mt-4" :disabled="sending"><div v-if="sending" class="mini loader"></div>Set owner</button>
          </div>
        </div>
        <div v-if="alert.info" class="alert alert-info" role="alert">{{alert.infoText}}</div>
        <div v-if="alert.success" class="alert alert-success" role="alert" v-html="alert.successText"></div>
        <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
      </div>
      <div v-if="account" class="mt-4">
        <h3 v-if="account.response">Account <router-link :to="EXPLORER+'@'+account.username">@{{account.username}}</router-link> created</h3>
        <h3 v-else>Account <router-link :to="EXPLORER+'@'+account.username">@{{account.username}}</router-link> already exists</h3>

        <div class="mt-5"><strong>Master password</strong></div>
        <div>{{account.password}}</div>

        <div class="mt-3"><strong>Owner Key</strong></div>
        <div>Public: {{account.owner.public_key}}</div>
        <div>Private: {{account.owner.private_key}}</div>

        <div class="mt-3"><strong>Active Key</strong></div>
        <div>Public: {{account.active.public_key}}</div>
        <div>Private: {{account.active.private_key}}</div>

        <div class="mt-3"><strong>Posting Key</strong></div>
        <div>Public: {{account.posting.public_key}}</div>
        <div>Private: {{account.posting.private_key}}</div>

        <div class="mt-3"><strong>Memo Key</strong></div>
        <div>Public: {{account.memo.public_key}}</div>
        <div>Private: {{account.memo.private_key}}</div>
      </div>
      <div v-else>No Account</div>
    </div>
  </div>
</template>

<script>
import { PrivateKey } from 'eftg-dsteem'
import axios from 'axios'

import Config from '@/config.js'
import Utils from '@/js/utils.js'
import SteemClient from '@/mixins/SteemClient.js'
import Alerts from '@/mixins/Alerts.js'
import HeaderEFTG from '@/components/HeaderEFTG'

export default {
  name: 'CreateAccount',

  data() {
    return {

      account: this.generateAccountDetails('testABC'),

      username: '',
      name: '',
      about: '',
      location: '',
      profile_image: '',
      cover_image: '',

      username2: '',

      sending: false,
      EXPLORER: Config.EXPLORER
    }
  },

  components: {
    HeaderEFTG
  },

  mixins: [
    SteemClient,
    Alerts
  ],

  methods: {
    async modify() {
      this.hideDanger()
      this.hideSuccess()

      if(!this.$store.state.auth.logged) this.showDanger('Please login')

      this.sending = true
      var metadata = {
        profile: {
          name: this.name,
          about: this.about,
          location: this.location,
          profile_image: this.profile_image,
          cover_image: this.cover_image
        }
      }
      var account = this.generateAccountDetails(this.username)

      try{
        var result = await this.steem_database_call('get_accounts', [[account.username]])
        if(!result || result.length == 0){
          console.log('account does not exists')
          throw new Error('This account does not exists')
        }

        var keyPresent = result[0].active.key_auths.find( (k)=>{ return k[0] === account.active.public_key })
        if(!keyPresent) {
          console.log('unknown private key')
          throw new Error('You do not have the private key to update the account')
        } 

        var operation = [
          'account_update',
          {
            account: account.username,
            memo_key: account.memo.public_key,
            json_metadata: JSON.stringify(metadata)
          }
        ]

        var result = await this.steem_broadcast_sendOperations([operation], PrivateKey.fromString(account.active.private_key))
        this.showSuccess('Account updated')
      }catch(error){
        console.log(error)
        this.showDanger('Error broadcasting operation: '+error.message)
      }
      this.sending = false
    },

    generateAccountDetails(username) {
      var roles = ['owner','active','posting','memo']

      var account = {
        username: username,
        password: null,
        owner:   {public_key: '', private_key: ''},
        active:  {public_key: '', private_key: ''},
        posting: {public_key: '', private_key: ''},
        memo:    {public_key: '', private_key: ''}
      }

      if(this.$store.state.auth.user !== username){
        var secret = ''
        if(this.$store.state.auth.keys.owner) secret = this.$store.state.auth.keys.owner.toString()
        account.password = PrivateKey.fromLogin(username, secret, 'owner').toString().substring(0,15)
        for(var i in roles){
          var role = roles[i]
          var privKey = PrivateKey.fromLogin(username, account.password, role)
          account[role].public_key = privKey.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
          account[role].private_key = privKey.toString()
        }
      }else{
        for(var i in roles){
          var role = roles[i]
          if( this.$store.state.auth.keys[role] ){
            var privKey = this.$store.state.auth.keys[role]
            account[role].public_key = privKey.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
            account[role].private_key = privKey.toString()
          }
        }
      }
      return account
    },

    async create() {
      this.hideDanger()
      this.hideSuccess()

      if(!this.$store.state.auth.logged) this.showDanger('Please login')

      var metadata = {
        profile: {
          name: this.name,
          about: this.about,
          location: this.location,
          profile_image: this.profile_image,
          cover_image: this.cover_image
        }
      }

      var account = this.generateAccountDetails(this.username)

      this.sending = true

      try{
        var result = await this.steem_database_call('get_accounts',[[account.username]])
        if(result && result.length > 0) {
          console.log('account already exists')
          if( account.owner.public_key === result[0].owner.key_auths[0][0] ||
              account.active.public_key === result[0].active.key_auths[0][0] ||
              account.posting.public_key === result[0].posting.key_auths[0][0]
            ){
            this.account = account
          }else{
            throw new Error('This account already exists')
          }
          this.sending = false
          return
        }

        var operation = [
          'account_create',
          {
            fee: Config.ACCOUNT_CREATION_FEE,
            creator: this.$store.state.auth.user,
            new_account_name: account.username,
            owner: {
              weight_threshold: 1,
              account_auths: [],
              key_auths: [[account.owner.public_key, 1]]
            },
            active: {
              weight_threshold: 1,
              account_auths: [],
              key_auths: [[account.active.public_key, 1]]
            },
            posting: {
              weight_threshold: 1,
              account_auths: [],
              key_auths: [[account.posting.public_key, 1]]
            },
            json_metadata: JSON.stringify(metadata),
            memo_key: account.memo.public_key,
          }
        ]

        account.response = await this.steem_broadcast_sendOperations([operation], this.$store.state.auth.keys.active)
        this.account = account
        this.showSuccess('Account created')
        console.log('account created')
        console.log(this.account)
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
      this.sending = false
    },

    async createOwner() {
      this.hideDanger()
      this.hideSuccess()
      
      if(!this.$store.state.auth.logged) this.showDanger('Please login')
      var operation = [
        'owner_create',
        {
          creator: this.$store.state.auth.user,
          owner: this.username2,
          signing_key: Config.STEEM_ADDRESS_PREFIX + '1111111111111111111111111111111114T1Anm'
        }
      ]
      try{
        var result = await this.steem_broadcast_sendOperations([operation], this.$store.state.auth.keys.active)
        this.showSuccess(`@${this.username2} is now an owner`)
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }      
    },

    changeLogin(){
    }
  },
}

</script>
