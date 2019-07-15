<template>
  <div>
    <HeaderEFTG ref="headerEFTG" v-on:login="onLogin" v-on:logout="onLogout"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center">Create account in the blockchain</h2>
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
    </div>
  </div>
</template>

<script>
import { PrivateKey } from 'eftg-dsteem'
import axios from 'axios'

import Config from '@/config.js'
import Utils from '@/js/utils.js'
import SteemClient from '@/mixins/SteemClient.js'
import HeaderEFTG from '@/components/HeaderEFTG'

export default {
  name: 'CreateAccount',

  data() {
    return {

      account: null,

      username: '',
      name: '',
      about: '',
      location: '',
      profile_image: '',
      cover_image: '',

      sending: false,
      EXPLORER: Config.EXPLORER
    }
  },

  components: {
    HeaderEFTG
  },

  mixins: [
    SteemClient
  ],

  methods: {
    create() {
      this.update('create_account', (result)=>{
        console.log(result.data)
        this.account = result.data
      }) 
    },

    modify() {
      this.update('modify_account', (result)=>{
        console.log(result)
        this.showSuccess('Account updated')
      })
    },

    async update(method, callback) {
      if(method !== 'create_account' && method !== 'modify_account'){
        this.showDanger(call + ' is not a valid call to the server')
        return
      }
      this.hideDanger()
      this.hideSuccess()

      var metadata = {
        profile: {
          name: this.name,
          about: this.about,
          location: this.location,
          profile_image: this.profile_image,
          cover_image: this.cover_image
        }
      }

      var data = {
        username: this.username,
        metadata: metadata
      }

      this.sending = true
      this.account = null
      try{
        var result = await axios.post(Config.SERVER_API + method, data)
        callback(result)
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
      this.sending = false
    },
  },
}

</script>
