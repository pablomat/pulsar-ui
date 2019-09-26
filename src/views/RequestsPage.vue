<template>
  <div>
    <HeaderEFTG ref="headerEFTG" v-on:login="changeLogin" v-on:logout="changeLogin"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center">Requests</h2>
      
      <div class="row">
        <div class="col-md-3">
          <h4>Pending</h4>
          <div class="card mb-2">
            <ul class="list-group list-group-flush">
              <li v-for="(request,index) in requestsPending" 
                class="list-group-item"
                :class="{
                  'approved': request.status  === 'approved',
                  'denied': request.status === 'denied',
                  'pending': request.status === 'pending'
                }"
                @click="selectRequest(index,'pending')"
              >
                {{request.course_name}}<br/><small>{{request.time2}}</small>
              </li>
            </ul>
          </div>
          <h4>Approved</h4>
          <div class="card mb-2">
            <ul class="list-group list-group-flush">
              <li v-for="(request,index) in requestsApproved" 
                class="list-group-item"
                :class="{
                  'approved': request.status  === 'approved',
                  'denied': request.status === 'denied',
                  'pending': request.status === 'pending'
                }"
                @click="selectRequest(index,'approved')"
              >
                {{request.course_name}}<br/><small>{{request.time2}}</small>
              </li>
            </ul>
          </div>
          <h4>Rejected</h4>
          <div class="card mb-2">
            <ul class="list-group list-group-flush">
              <li v-for="(request,index) in requestsRejected" 
                class="list-group-item"
                :class="{
                  'approved': request.status  === 'approved',
                  'denied': request.status === 'denied',
                  'pending': request.status === 'pending'
                }"
                @click="selectRequest(index,'denied')"
              >
                {{request.course_name}}<br/><small>{{request.time2}}</small>
              </li>
            </ul>
          </div>
        </div>
        <div class="col">
          <div v-if="current">
            <h3>Request {{current.course_name}}</h3>
            <div class="row">
              <div class="col-md-2">Student name</div>
              <div class="col">{{current.family_name}}, {{current.name}}</div>
            </div>
            <div class="row">
              <div class="col-md-2">Student's public key</div>
              <div class="col">{{current.key}}</div>
            </div>
            <div class="row">
              <div class="col-md-2">Date of request</div>
              <div class="col">{{current.start_date}}</div>
            </div>
            <div class="row">
              <div class="col-md-2">Status</div>
              <div class="col">{{current.status}}</div>
            </div>
            <div class="row" v-if="current.comments">
              <div class="col-md-2">Comments</div>
              <div class="col">{{current.comments}}</div>
            </div>
            <div class="row" v-if="current.preconditions && current.preconditions.length > 0">
              <div class="col-md-2">Provided Badges</div>
              <div class="col">
                <div v-for="p in current.preconditions" class="custom-card">
                  <div class="image-diploma"
                    :style="{ backgroundImage: 'url(' + p.issuer_image + ')' }"
                  ></div>
                  <div class="custom-card-body">
                    <h5 class="card-title"><router-link :to="p.course_link">{{p.course}}</router-link> ({{p.badge.issuer}})</h5>
                    <ul class="card-text list-group">
                      <li v-for="message in p.messages" class="list-group-item" :class="{'bg-danger':!message.ok}">
                      <font-awesome-icon :icon="message.ok?'check':'times'" class="mr-2"/> {{message.message}} <router-link v-if="message.link" :to=message.link.url>{{message.link.text}}</router-link>
                      </li>
                    </ul>
                  </div>
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
      requestsPending: [],
      requestsApproved: [],
      requestsRejected: [],
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
        var requests = response.data.reverse()
        var rPending  = []
        var rApproved = []
        var rRejected = []
        for(var i in requests){
          var r = requests[i]

          r.course_name = this.courses.find((c)=>{ return r.course === c._id }).name
          r.time2 = r.time.slice(0,-9)

          if(!r.preconditions) r.preconditions = []
          for(var j in r.preconditions){
            var p = r.preconditions[j]
            var check =  await this.checkProofs(p, r)
            console.log(check)
            p.course = check.course
            p.course_link = check.course_link
            p.messages = check.messages
            p.issuer_image = check.issuer_image
          }
          switch(r.status){
            case 'pending':
              rPending.push(r)
              break
            case 'approved':
              rApproved.push(r)
              break
            case 'denied':
              rRejected.push(r)
              break
            default:
              throw new Error(`status type '${r.status}' does not exist`)
          }
        }
        this.requestsPending = rPending
        this.requestsApproved = rApproved
        this.requestsRejected = rRejected

        this.reloadCurrent()
      }catch(error){
        console.log(error)
      }
    },

    async checkProofs(data, request) {
      var messages = []
      var course = ''
      var course_link = ''
      var issuer_image = Config.NO_PROFILE_IMAGE
      var i = 0
      var verification
      if(data.proof) {
        try{
          var sgnTrx = data.proof
          var chainId = this.RPCnode_initClient().chainId
          if(sgnTrx.operations[0].length > 0){
            if(sgnTrx.operations[0][0] === 'transfer')
              messages[i++] = {ok: true, message: `Message: "${sgnTrx.operations[0][1].memo}"`}
          }else{
            messages[i++] = {ok: false, message: 'The proof does not contain operations'}
            verification = false
          }
          var expiration = new Date(sgnTrx.expiration + 'Z')
          if(new Date() <= expiration){
            messages[i++] = {ok: true, message: `Proof valid until ${sgnTrx.expiration}`}
          }else{
            messages[i++] = {ok: false, message: `The proof has expired (${sgnTrx.expiration})`}
            verification = false
          }
          var pubKeys = this.getSignatureKeys(sgnTrx,chainId)
          if(pubKeys.length == 0){
            messages[i++] = {ok: false, message: 'The proof has not been signed'}
            verification = false
          }else if(pubKeys.length == 1){
            // messages[i++] = {ok: true, message: `The proof has been signed by ${pubKeys[0]}`}
          }else{
            // messages[i++] = {ok: true, message: `The proof has been signed by the following keys: ${pubKeys}`}
          }
        }catch(error){
          messages[i++] = {ok: false, message: `Problems reading the proof: ${error.message}`}
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
          course_link = Config.EXPLORER + url
          try{
            var content = await this.steem_database_call( 'get_content', [data.badge.issuer, data.badge.permlink] )
            if(!content) throw new Error('There is no content')
            if(content.json_metadata === '') throw new Error('There is no metadata')
            course = content.title
            var metadata = JSON.parse(content.json_metadata)
            if(metadata && metadata.badge){
              messages[i++] = {ok: true, message: `This badge from ${data.badge.issuer} is present in the blockchain`}
            }else{
              messages[i++] = {ok: false, message: 'There is no badge in ', link:{text:content.title, url:Config.EXPLORER+url}}
              verification = false
            }
            if(metadata && metadata.assertions){
              pubKeys.forEach( (pubKey) => {
                var assertion = metadata.assertions.find( (a)=>{ return a.recipient.identity === pubKey.toString() })
                if(assertion){
                  messages[i++] = {ok: true, message: `The signature of ${request.name} ${request.family_name} confirms the ownership of the badge`}
                }else{
                  messages[i++] = {ok: false, message: `The signature of ${request.name} ${request.family_name} do not match with the any ID in the badge`}
                  verification = false
                }
              })
            }else{
              messages[i++] = {ok: false, message: 'There are no assertions in the badge'}
              verification = false
            }
          }catch(error){
            messages[i++] = {ok: false, message: `Problems reading the badge ${url}. Reason: ${error.message}`}
            console.log(error)
            verification = false
          }

          try{
            var response_accounts = await this.steem_database_call('get_accounts',[[data.badge.issuer]])
            var issuer_account = response_accounts[0]
            issuer_image = JSON.parse(issuer_account.json_metadata).profile.profile_image
          }catch(error){
            console.log(`Error with get_accounts for the issuer '${data.badge.issuer}'`)
            console.log(error)
          }
        }else{
          messages[i++] = {ok: false, message: 'The badge does not contain issuer and permlink'}
          verification = false
        }
      }

      return {
        messages: messages,
        course: course,
        course_link: course_link,
        issuer_image: issuer_image
      }
    },

    async loadCourses() {
      try{
        var response = await axios.get(Config.SERVER_API + "courses")
        console.log(response.data.courses.length)
        this.courses = response.data.courses
      }catch(error){
        console.log(error)
      }
    },

    selectRequest(id,type) {
      switch(type){
        case 'pending':
          this.current = this.requestsPending[id]
          break
        case 'approved':
          this.current = this.requestsApproved[id]
          break
        case 'denied':
          this.current = this.requestsRejected[id]
          break
        default:
          throw new Error(`status type '${type}' does not exist`)
      }
    },

    reloadCurrent() {
      if(!this.current) return
      var current = this.requestsPending.find( (s)=>{ return s._id === this.current._id } )
      if(!current)
        current = this.requestsApproved.find( (s)=>{ return s._id === this.current._id } )
      if(!current)
        current = this.requestsRejected.find( (s)=>{ return s._id === this.current._id } )
      this.current = current
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

<style scoped>

.approved{
  background-color: #e8ffef;
}

.denied{
  background-color: #fff8e8;
}

.pending{
  background-color: white;
}

.image-diploma{
  display: inline-block;
  height: 4rem;
  width: 4rem;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  vertical-align: middle;
}

.custom-card{
  padding: 15px;
}

.custom-card-body{
  display: inline-block;
  width: calc(100% - 4rem - 15px);
  vertical-align: top;
  margin-left: 15px;
}
</style>
