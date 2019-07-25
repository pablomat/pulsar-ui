<template>
  <div>
    <b-modal ref="modalBadge" hide-footer title="Badge">
      <h2>{{badge.course}}</h2>
      <h3>{{badge.university}}</h3>
      <div v-if="badge.pending" class="text-danger mt-3">
        Pending course
        <div class="row mt-3">
          <div class="col-md-5">
            <input class="form-control" type="text" id="input_badge_url"
              v-model="badge_url" placeholder="Badge"/>
          </div>
          <div class="col-md-2">
            <button @click="add_badge" class="btn btn-primary" :disabled="sending"><div v-if="sending" class="mini loader"></div>Add badge</button>
          </div>
        </div>
      </div>
      <router-link v-else :to="badge.badge.link">Link to explorer</router-link>
    </b-modal>

    <b-modal ref="modalKeys" hide-footer title="Keys">
      <h4>Public key</h4>
      <span class="public-key">{{key.public_key}}</span>
      <div v-if="show_private_key">
        <h4 class="mt-3">Private key</h4>
        <span class="public-key">{{key.private_key}}</span>
      </div>
      <button class="btn btn-danger col-12 mt-2" 
        @click="toggleKey"
      >{{show_private_key?'Hide':'Show private key'}}</button>
    </b-modal>

    <b-modal ref="modalCreateKeys" hide-footer title="Register to new course">
      <h5>University</h5>
      <select class="form-control" v-model="create_key_issuer">
        <option v-for="(opt,key) in issuers" :value="opt.name">{{opt.name}}</option>
      </select>
      <h5 class="mt-3">Course</h5>
      <select class="form-control" v-model="create_key_course">
        <option v-for="(opt,key) in courses" :value="opt._id">{{opt.name}}</option>
      </select>
      <h5 class="mt-3">Preconditions</h5>
      <div v-if="preconditions.length > 0">
        <div v-for="p in preconditions">
          <select class="form-control" v-model="p.input">
            <option v-for="(opt,index) in keysWithBadge" :value="opt.badge.link">
              <div class="row">
                <div class="col-12">{{opt.course}}</div>
                <div class="col-12"><small>{{opt.university}}</small></div>
              </div>
            </option>
          </select>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-6">
          <button @click="addPrecondition" class="btn btn-primary">Add badge</button>
        </div>
        <div class="col-6">
          <button @click="removePrecondition" class="btn btn-secondary float-right">Remove</button>
        </div>
      </div>
      <button @click="register_to_course" class="btn btn-primary mt-5" :disabled="sending"><div v-if="sending" class="mini loader"></div>Register</button>
    </b-modal>

    <b-modal ref="modalProof" hide-footer title="Create proof">
      <CreateProof :badge="key.badge"></CreateProof>
    </b-modal>

    <HeaderEFTG ref="headerEFTG" v-on:login="onLogin" v-on:logout="onLogout"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center">Dashboard</h2>
      <div v-if="false && keys.length > 0" class="row mt-3 mb-3">
        <div class="offset-2 col-8">
          <pie-chart :data="dataChart" :options="optionsChart"/>
        </div>
      </div>     
      <div role="tablist">
        <b-card 
          v-for="(course,index) in keys"
          v-bind:key="index"
          v-bind:value="index"class="mb-1"
        >
          <div role="tab" v-b-toggle="'accordion'+index">
            <div class="square4" v-bind:style="{ backgroundImage: 'url(' + course.imgUrl + ')' }"></div>
            <div class="comp-square4">
              <div class="card-title">{{course.course_name}}<span v-if="!course.pending" class="badge badge-pill badge-success float-right">Finished</span></div>
              <div class="card-subtitle text-muted">{{course.university}}</div>
            </div>
          </div>
          <b-collapse :id="'accordion'+index" visible accordion="my-accordion" role="tabpanel">
            <div v-if="course.badge.assertion" class="mt-3">Award date: {{course.badge.assertion.award_date.slice(0,-9)}}</div>
            <div v-else-if="course.registration_pending">Registration in progress</div>
            <div v-else>Registered: {{course.registration.comments}}</div>
            <div class="card-text mt-2">
              <div class="row">
                <div class="col-4">
                <button class="btn btn-primary col-12" @click="showKeys(course)">Keys</button>
                </div>
                <div class="col-4">
                <button class="btn col-12" :class="{'btn-primary':!course.pending, 'btn-secondary':course.pending}" @click="showBadge(course)">Badge</button>
                </div>
                <div class="col-4" v-if="!course.pending">
                <button class="btn btn-primary col-12" @click="generateProof(course)">Proof</button>
                </div>
              </div>
            </div>
          </b-collapse>
        </b-card>
      </div>
      <div class="row mt-3">
        <div class="col-12">
          <div class="float-right">
            <button @click="showModalCreateKey" class="btn btn-primary btn-circle" style="font-size:24px;">+</button>
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
import debounce from 'lodash.debounce'
import axios from 'axios'
import { saveAs } from 'file-saver'

import Config from '@/config.js'
import Utils from '@/js/utils.js'
import HeaderEFTG from '@/components/HeaderEFTG'
import CreateProof from '@/components/CreateProof'
import PieChart from '@/components/PieChart'
import SteemClient from '@/mixins/SteemClient.js'
import Alerts from '@/mixins/Alerts'

import dev_data from '@/assets/dev_data.json'

export default {
  name: 'Proof',

  data() {
    return {
      keys: [],
      keysWithBadge: [],
      preconditions: [],
      badge: { badge: {} },
      badge_url: '',
      key: {},
      show_private_key: false,
      dataChart: {
				datasets: [{
					data: [
						1,
						1
					],
					backgroundColor: [
						'#2eb326',
						'#b34526'
					],
					label: 'Dataset 1'
				}],
				labels: [
					'Granted',
					'In progress'
				]
			},
			optionsChart: {
				responsive: true
			},

      create_key_issuer: '',
      create_key_course: '',

      courses: [],
      issuers: [],

      sending: false,
      error: {
        university: false,
        course: false
      },
      errorText: {
        university: '',
        course: ''
      },
      EXPLORER: Config.EXPLORER,
    }
  },

  components: {
    HeaderEFTG,
    CreateProof,
    PieChart
  },

  mixins: [
    Alerts,
    SteemClient
  ],

  created() {
    this.loadKeys()
    this.debounced_loadCourses = debounce(this.loadCourses, 300)
  },

  watch: {
    create_key_issuer: function() {
      this.debounced_loadCourses();
    },
    create_key_course: function() {
      console.log('course changed')
    }
  },

  methods: {
    async loadKeys() {
      if(process.env.VUE_APP_DEV){
        this.keys = dev_data.keys     
      }else{
        var response = await axios.get(Config.SERVER_API + "get_keys")
        this.keys = response.data
      }

      this.keysWithBadge = []
      this.keys.forEach( (k)=>{
        if(k.badge) k.badge.link = this.EXPLORER + '@' + k.badge.issuer + '/' + k.badge.permlink
        if(k.registration){
          k.registration_pending = k.registration.pending
        }

        if(k.badge && k.badge.issuer && k.badge.permlink) this.keysWithBadge.push(k)
        if(!k.imgUrl) k.imgUrl = Config.DEFAULT_COURSE_IMAGE
      })
      this.dataChart.datasets[0].data = [ this.keysWithBadge.length , this.keys.length - this.keysWithBadge.length ]

      for(var i in this.keysWithBadge){
        try{
          var key = this.keysWithBadge[i]
          key.badge.content = await this.steem_get_badge(key.badge)
          key.badge.assertion = key.badge.content.metadata.assertions.find( (a)=>{ return a.recipient.identity === key.public_key })
          this.keys.find((k)=>{return k.public_key === key.public_key}).badge = key.badge
          console.log('badge loaded: '+key.badge.permlink)
          console.log('Assertion award date: '+key.badge.assertion.award_date)
        }catch(error){
          console.log('Cannot get badge: '+error.message)
        }
      }
    },

    async loadCourses() {
      var issuer = this.issuers.find( (i)=>{ return i.name === this.create_key_issuer })
      var response = await axios.get(issuer.api + 'courses')
      this.courses = response.data
    },

    async register_to_course() {
      this.sending = true
      this.hideSuccess()
      this.hideDanger()

      var preconditions = []
      this.preconditions.forEach( (p)=>{ preconditions.push(p.input) })
      console.log('preconditions')
      console.log(preconditions)
      try{
        var data = {
          university: this.create_key_issuer,
          course: this.create_key_course,
          course_name: this.courses.find( (c)=>{ return c._id === this.create_key_course }).name,
          preconditions: preconditions
        }

        var response = await axios.post(Config.SERVER_API + "create_keys", data)          
        this.showSuccess('Keys created')
        this.loadKeys()
        this.$refs.modalCreateKeys.hide()
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }

      this.sending = false
      this.hideInfo()
    },

    addPrecondition() {
      this.preconditions.push({
        input: 0,
      })
    },

    removePrecondition() {
      this.preconditions.splice(-1,1)
    },

    async add_badge() {
      try{
        var data = { badge_url: this.badge_url } 
        var response = await axios.post(Config.SERVER_API + 'update_key', data)
        this.showSuccess('Badge added')
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
    },

    async showModalCreateKey() {
      this.$refs.modalCreateKeys.show()
      var response = await axios.get(Config.SERVER_API + 'issuers')
      this.issuers = response.data
    },

    showBadge(course) {
      this.badge = course
      this.$refs.modalBadge.show()
    },

    showKeys(course) {
      this.key = course
      this.show_private_key = false
      this.$refs.modalKeys.show()
    },

    generateProof(course) {
      this.key = course
      this.$refs.modalProof.show()
    },

    toggleKey(){
      this.show_private_key = !this.show_private_key
      console.log('toggle now is '+this.show_private_key)
    },

    onLogin() {},
    onLogout() {}
  },
}

</script>

<style scoped>

.public-key {
  font-family: monospace;
  font-size: 1.3rem;
  overflow-wrap: break-word;
}

.square4 {
  display: inline-block;
  height: 4rem;
  width: 4rem;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  border-radius: 5%;
  vertical-align: middle;
}

.comp-square4 {
  width: calc(100% - 5rem);
  display: inline-block;
  vertical-align: middle;
  margin-left: 1rem;
}

.btn-circle {
  width: 50px;
  height: 50px;
  text-align: center;
  padding: 6px 0;
  font-size: 12px;
  line-height: 1.428571429;
  border-radius: 25px;
}
</style>
