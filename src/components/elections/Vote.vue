<template>
  <div>
    <HeaderEFTG :showAuth="true" ref="headerEFTG"></HeaderEFTG>
    <div class="container">
      <h2>Elections 2019</h2>
      <h4>Select your candidate</h4>
      <div class="row">
        <div v-for="(candidate, index) in candidates" :key="index" class="col-md-3">
          <div class="card mb-3" :class="{'text-white':candidate.selected,'bg-primary':candidate.selected}" @click="selectCandidate(index)">
            <img class="card-img-top" :src="candidate.image" :alt="candidate.name">
            <div class="card-body">
              <h5 class="card-title">{{candidate.name}}</h5>
              <p class="card-text">{{candidate.description}}</p>
            </div>
          </div>
        </div>
      </div>
      <div v-if="this.$store.state.auth.logged" class="mb-2">
        <button v-on:click="vote" class="btn btn-primary btn-large mr-2" :disabled="sending"><div v-if="sending" class="mini loader"></div>Vote</button>
        <div v-if="sending" class="btn">
          <button v-on:click="abort" class="btn btn-secondary mr-2" :disabled="aborting"><div v-if="aborting" class="mini loader"></div>Abort</button>
        </div>
      </div>
      <div v-if="alert.info" class="alert alert-info" role="alert">{{alert.infoText}}</div>
      <div v-if="alert.success" class="alert alert-success" role="alert" v-html="alert.successText"></div>
      <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
    </div>
  </div>
</template>

<script>
import Config from '@/config.js'
import SteemClient from '@/mixins/SteemClient.js'
import HeaderEFTG from '@/components/HeaderEFTG'
import Candidates from '@/assets/candidates.json'

import steem from '@steemit/steem-js'

export default {
  name: 'Vote',
  data () {
    return {
      candidates: [],
      id_selected: -1,
      sending: false,
      moderator: 'initminer',
      electionId: 'elections-20190402'
    }
  },

  components: {
    HeaderEFTG
  },

  mixins: [
    SteemClient
  ],

  created() {
    steem.api.setOptions({address_prefix: 'EUR'})
    this.candidates = Candidates
    for(var i in this.candidates) {
      this.candidates[i].selected = false
    }
  },

  methods: {
    selectCandidate(id) {
      if(this.id_selected >= 0) {
        var c = this.candidates[this.id_selected]
        c.selected = false
        this.$set(this.candidates, this.id_selected, c )
      }

      var c = this.candidates[id]
      c.selected = true
      this.$set(this.candidates, id, c)
      this.id_selected = id
    },

    async vote() {
      this.sending = true
      this.hideSuccess()
      this.hideDanger()

      try{
        if(!this.$store.state.auth.logged)
          throw new Error('Please login')
        if(this.id_selected < 0)
          throw new Error('Please select a candidate or blank vote')

        var candidate = this.candidates[this.id_selected]
        var username = this.$store.state.auth.user
        var privKey = this.$store.state.auth.keys.posting

        var salt = Math.random().toString(36).substring(2)
        var accounts = await this.steem_database_call('get_accounts', [[this.moderator]])
        var moderator_account = accounts[0]
        var msg = '#' + candidate.name + '::' + salt
        var msg_encrypted = steem.memo.encode(privKey.toString(), moderator_account.posting.key_auths[0][0], msg)

        var json = {
          candidate: msg_encrypted
        }
        var operation = [
          'custom_json',
          {
            required_auths: [],
            required_posting_auths: [username],
            id: this.electionId,
            json: JSON.stringify(json)
          }
        ]
        var result = await this.steem_broadcast_sendOperations([operation], privKey)
        this.showSuccess('<a href="'+Config.EXPLORER+'b/'+result.block_num+'/'+result.id+'" class="alert-link" target="_blank">Vote broadcasted!</a>')
      }catch(error){
        console.log(error)
        this.showDanger(error.message)
      }

      this.sending = false
    },

    abort() {
      this.abortNodeConnection = true
      if(this.sending) this.aborting = true
    },
  }
}
</script>
