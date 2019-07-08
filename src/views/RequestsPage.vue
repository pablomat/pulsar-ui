<template>
  <div>
    <HeaderEFTG ref="headerEFTG" v-on:login="changeLogin" v-on:logout="changeLogin"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center">Requests</h2>
      
      <div class="row">
        <div class="col-md-3">
          <div class="card mb-2">
            <ul class="list-group list-group-flush">
              <li v-for="(request,index) in requests" class="list-group-item" @click="selectRequest(index)">
                {{request.course}}
              </li>
            </ul>
          </div>
        </div>
        <div class="col">
          <div v-if="current">
            <h3>Request {{current.course}}</h3>
            <div class="row">
              <div class="col-md-3">Student</div>
              <div class="col">{{current.family_name}}, {{current.name}}</div>
            </div>
            <div class="row">
              <div class="col-md-3">Key</div>
              <div class="col">{{current.key}}</div>
            </div>
            <div class="row">
              <div class="col-md-3">Date</div>
              <div class="col">{{current.start_date}}</div>
            </div>
            <div class="row">
              <div class="col-md-3">Status</div>
              <div class="col">{{current.status}}</div>
            </div>
            <div class="mt-4 mb-2">Comments</div>
            <input class="form-control" type="text" id="input_comments" v-model="comments" placeholder="Comments"/>
            <button class="btn btn-primary mr-2" @click="resolve(true)">Approve</button>
            <button class="btn btn-primary" @click="resolve(false)">Reject</button>
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
import axios from 'axios'
import Config from '@/config.js'
import Utils from '@/js/utils.js'
import SteemClient from '@/mixins/SteemClient.js'
import HeaderEFTG from '@/components/HeaderEFTG'
import Alerts from '@/mixins/Alerts.js'

export default {
  name: 'RequestsPage',

  data() {
    return {
      requests: [],
      current: null,

      comments: '',
    }
  },

  components: {
    HeaderEFTG
  },

  mixins: [
    Alerts
  ],

  created() {
    this.loadRequests()
  },

  methods: {
    async loadRequests() {
      try{
        var response = await axios.get(Config.SERVER_API + "requests")
        console.log(response.data.length)
        this.requests = response.data

        this.reloadCurrent()
        console.log('load request')
        console.log(this.requests)
      }catch(error){
        console.log(error)
      }
    },

    selectRequest(id) {
      this.current = this.requests[id]
    },

    reloadCurrent() {
      if(!this.current) return
      this.current = this.requests.find( (s)=>{ return s._id === this.current._id } )
    },

    async resolve(approve) {
      try{

        var data = {
          request: {
            _id: this.current._id
          },
          approve: approve,
          comments: this.comments
        }

        await axios.post(Config.SERVER_API + 'resolve_request', data)
        this.showSuccess('Request updated')
        await this.loadRequests()
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }
    },

    changeLogin() {
      if( this.$store.state.auth.logged) {
        if( this.$store.state.auth.role === 'admin' ){
          this.isAdmin = true
          console.log('Logged in as admin')
        } else {
          this.isAdmin = false
          console.log('Logged in as ' + this.$store.state.auth.role)
        }
      } else {
        this.isAdmin = false
      }
    },
  },
}

</script>
