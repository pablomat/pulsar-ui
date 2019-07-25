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
                {{request.course_name}}
              </li>
            </ul>
          </div>
        </div>
        <div class="col">
          <div v-if="current">
            <h3>Request {{current.course_name}}</h3>
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
            <div class="row" v-if="current.preconditions && current.preconditions.length > 0">
              <div class="col-md-3">Provided Badges</div>
              <div class="col">
                <div v-for="p in current.preconditions">
                  <ul>
                    {{p.course}}
                    <li v-for="message in p.messages">
                    <font-awesome-icon :icon="message.ok?'check':'times'" class="mr-2"/> {{message.message}} <router-link v-if="message.link" :to=message.link.url>{{message.link.text}}</router-link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="mt-4 mb-2">Comments</div>
            <input class="form-control mb-3" type="text" id="input_comments" v-model="comments" placeholder="Comments"/>
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
import { Client, PrivateKey, cryptoUtils, Signature } from 'eftg-dsteem'

export default {
  name: 'RequestsPage',

  data() {
    return {
      requests: [],
      courses: [],
      current: null,

      comments: '',
    }
  },

  components: {
    HeaderEFTG
  },

  mixins: [
    Alerts,
    SteemClient
  ],

  created() {
    this.loadCourses().then( this.loadRequests )
  },

  methods: {
    async loadRequests() {
      try{
        var response = await axios.get(Config.SERVER_API + "requests")
        console.log(response.data.length)
        this.requests = response.data
        console.log(this.requests)
        for(var i in this.requests){
          var r = this.requests[i]

          r.course_name = this.courses.find((c)=>{ return r.course === c._id }).name

          if(!r.preconditions) r.preconditions = []
          for(var j in r.preconditions){
            var p = r.preconditions[j]
            var check =  await this.checkProofs(p)
            console.log(check)
            p.course = check.course
            p.messages = check.messages
          }
        }

        this.reloadCurrent()
        console.log('load request')
        console.log(this.requests)
      }catch(error){
        console.log(error)
      }
    },

    async checkProofs(data) {
      var messages = []
      var course = ''
      var i = 0
      if(data.proof) {
        try{
          var sgnTrx = data.proof
          var chainId = this.RPCnode_initClient().chainId
          if(sgnTrx.operations[0].length > 0){
            if(sgnTrx.operations[0][0] === 'transfer')
              messages[i++] = {ok: true, message: 'Message in the proof: '+sgnTrx.operations[0][1].memo}
          }else{
            messages[i++] = {ok: false, message: 'The proof does not contain operations'}
            verification = false
          }
          var expiration = new Date(sgnTrx.expiration + 'Z')
          if(new Date() <= expiration){
            messages[i++] = {ok: true, message: 'The proof has not expired ('+sgnTrx.expiration+')'}
          }else{
            messages[i++] = {ok: false, message: 'The proof has expired ('+sgnTrx.expiration+')'}
            verification = false
          }
          var pubKeys = this.getSignatureKeys(sgnTrx,chainId)
          if(pubKeys.length == 0){
            messages[i++] = {ok: false, message: 'The proof has not been signed'}
            verification = false
          }else if(pubKeys.length == 1){
            messages[i++] = {ok: true, message: 'The proof has been signed by '+pubKeys[0]}
          }else{
            messages[i++] = {ok: true, message: 'The proof has been signed by the following keys: '+pubKeys}
          }
        }catch(error){
          messages[i++] = {ok: false, message: 'Problems reading the proof: '+error.message}
          console.log(error)
          verification = false
        }
      }else {
        messages[i++] = {ok: false, message: 'There is no proof in the file'}
        verification = false
      }
      if(data.badge) {
        if(data.badge.issuer && data.badge.permlink) {
          var url = '@'+data.badge.issuer+'/'+data.badge.permlink
          try{
            var content = await this.steem_database_call( 'get_content', [data.badge.issuer, data.badge.permlink] )
            if(!content) throw new Error('There is no content')
            if(content.json_metadata === '') throw new Error('There is no metadata')
            course = content.title
            var metadata = JSON.parse(content.json_metadata)
            if(metadata && metadata.badge){
              messages[i++] = {ok: true, message: 'Badge found in the blockchain: ', link:{text:content.title, url:Config.EXPLORER+url}}
            }else{
              messages[i++] = {ok: false, message: 'There is no badge in ', link:{text:content.title, url:Config.EXPLORER+url}}
              verification = false
            }
            if(metadata && metadata.assertions){
              pubKeys.forEach( (pubKey) => {
                var assertion = metadata.assertions.find( (a)=>{ return a.recipient.identity === pubKey.toString() })
                if(assertion){
                  messages[i++] = {ok: true, message: 'The public key '+pubKey+' is present in the badge'}
                }else{
                  messages[i++] = {ok: false, message: 'The public key '+pubKey+' is not present in the badge'}
                  verification = false
                }
              })
            }else{
              messages[i++] = {ok: false, message: 'There are no assertions in the badge'}
              verification = false
            }
          }catch(error){
            messages[i++] = {ok: false, message: 'Problems reading the badge '+url+'. Reason: '+error.message}
            console.log(error)
            verification = false
          }
        }else{
          messages[i++] = {ok: false, message: 'The badge does not contain issuer and permlink'}
          verification = false
        }
      }

      return {
        messages: messages,
        course: course
      }
    },

    async loadCourses() {
      try{
        var response = await axios.get(Config.SERVER_API + "courses")
        console.log(response.data.length)
        this.courses = response.data.courses
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

    getSignatureKeys(trx,chainId){
      const digest = cryptoUtils.transactionDigest(trx,chainId)
      var keys = []
      for(var i in trx.signatures){
        var sig = trx.signatures[i]
        keys.push(Signature.fromString(sig).recover(digest))
      }
      return keys
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
