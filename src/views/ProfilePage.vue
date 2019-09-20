<template>
  <div>
    <HeaderEFTG ref="headerEFTG" v-on:login="onLogin" v-on:logout="onLogout"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center">Profile</h2>
      <div id="eftg-form" novalidate>
        <div class="form-group row">
          <label for="input_name" class="col-md-2 col-form-label">NAME</label>
          <div class="col-md-10">
            <input class="form-control" type="text" id="input_name" v-model="name" placeholder="Name"/>
          </div>
        </div>
        <div class="form-group row">
          <label for="input_family_name" class="col-md-2 col-form-label">FAMILY NAME</label>
          <div class="col-md-10">
            <input class="form-control" type="text" id="input_family_name" v-model="family_name" placeholder="Family Name"/>
          </div>
        </div>
        <div class="form-group row">
          <label for="input_about" class="col-md-2 col-form-label">ADDRESS</label>
          <div class="col-md-10">
            <input class="form-control" type="text" id="input_about" v-model="address" placeholder="Address"/>
          </div>
        </div>
        <div class="form-group row">
          <label for="input_image" class="col-md-2 col-form-label">IMAGE</label>
          <div class="col-md-10">
            <input class="form-control" type="text" id="input_image" v-model="image" placeholder="Url Image"/>
          </div>
        </div>
        <button class="btn btn-primary btn-large mt-3 mb-3" @click="update" :disabled="sending"><div v-if="sending" class="mini loader"></div>Update</button>
        <div v-if="alert.info" class="alert alert-info" role="alert">{{alert.infoText}}</div>
        <div v-if="alert.success" class="alert alert-success" role="alert" v-html="alert.successText"></div>
        <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

import Config from '@/config.js'
import Utils from '@/js/utils.js'
import Alerts from '@/mixins/Alerts.js'
import router from '@/router.js'
import HeaderEFTG from '@/components/HeaderEFTG'

export default {
  name: 'Profile',

  data() {
    return {

      name: '',
      family_name: '',
      address: '',
      image: '',

      sending: false,
    }
  },

  created() {
    this.loadUserData()
  },

  components: {
    HeaderEFTG
  },

  mixins: [
    Alerts
  ],

  methods: {
    async update() {
      this.hideDanger()
      this.hideSuccess()

      var data = {
        profile: {
          name: this.name,
          family_name: this.family_name,
          address: this.address,
          image: this.image
        }
      }

      this.sending = true
      try{
        var result = await axios.post(Config.SERVER_API + 'update_profile', data)
        this.showSuccess('User updated')
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
      this.sending = false
    },

    async loadUserData(){
      this.name = this.$store.state.auth.profile.name
      this.family_name = this.$store.state.auth.profile.family_name
      this.address = this.$store.state.auth.profile.address
      this.image = this.$store.state.auth.profile.image
    },

    onLogin(){
      this.loadUserData()
    },

    onLogout(){
      router.push(Config.PAGE_AFTER_LOGOUT)
    }
  },
}

</script>
