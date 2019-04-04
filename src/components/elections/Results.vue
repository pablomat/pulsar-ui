<template>
  <div>
    <HeaderEFTG :showAuth="true" ref="headerEFTG"></HeaderEFTG>
    <div class="container">
      <h2>Elections 2019</h2>
      <h4>Results</h4>
      <div v-if="candidates.length > 0">
        <table class="table">
          <thead>
            <tr class="table-primary">
              <th scope="col">#</th>
              <th scope="col">Candidate</th>
              <th scope="col">Votes</th>
              <th scope="col">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(candidate,index) in candidates"
              v-bind:key="candidate.id"
              v-bind:value="candidate.name"
            >
              <td>{{ index+1 }}</td>
              <td
                ><div v-bind:style="{ backgroundImage: 'url(' + candidate.image + ')' }" class="image-profile mr-2"                  
                ></div>{{ candidate.name }}
              </td>
              <td>{{ candidate.votes }}</td>
              <td>{{ candidate.percentage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="this.$store.state.auth.logged" class="mb-2">
        <button v-on:click="searchVotes" class="btn btn-primary btn-large mr-2" :disabled="searchingVotes"><div v-if="searchingVotes" class="mini loader"></div>Search Votes</button>
        <button v-on:click="publish" class="btn btn-primary btn-large mr-2" :disabled="sending"><div v-if="sending" class="mini loader"></div>Publish</button>
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
  name: 'Results',
  data () {
    return {
      candidates: [],
      votes: [],
      sending: false,
      searchingVotes: false,
      period: {
        start: '2019-04-04T07:40:00',
        end:   '2019-04-04T08:10:00'
      },
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
      this.candidates[i].votes = 0
      this.candidates[i].percentage = '0.00 % '
    }
  },

  methods: {
    async searchVotes() {
      this.searchingVotes = true
      this.hideSuccess()
      this.hideInfo()

      var iniBlock = await this.findBlock(this.period.start)
      try{
        var endBlock = await this.findBlock(this.period.end)
      }catch(error){
        if(error.name === 'FutureBlock')
          var endBlock = error.gpo.head_block_number
        else
          throw error
      }
      var operations = []
      for(var i = iniBlock; i<=endBlock; i++) {
        this.showInfo(`Reading block ${i}. [${i-iniBlock}/${endBlock-iniBlock}]`)
        var block = await this.steem_database_call('get_block',[i])
        var ops = this.filterOperations( block, [['custom_json', { id: this.electionId }]] )
        operations = operations.concat(ops)
      }
      console.log(operations.length + ' operations found')

      var privKey = this.$store.state.auth.keys.posting

      this.showInfo('Calculating votes...')
      for(var i in operations) {
        var op = operations[i]
        var op_json = JSON.parse(op[1].json)
        var voterName = op[1].required_posting_auths[0]
        if(!op_json || !op_json.candidate) {
          console.log('Error: incorrect json in operation: '+JSON.stringify(op_json)+'. Account: '+voterName)
          continue
        }

        var msg_encrypted = op_json.candidate
        var msg = steem.memo.decode(privKey.toString(), msg_encrypted)
        var candidate = msg.substring(1).split('::')[0]
        candidate = this.candidates.find( (c)=>{return c.name === candidate} )
        if(!candidate){
          console.log('Error: incorrect candidate: '+op_json.candidate+'. Account: '+voterName)
          continue
        }

        candidate.votes++

        var vote = this.votes.find( (v)=>{return v.voter===voterName} )
        if(vote) {//update vote (modify)
          var old_candidate = this.candidates.find( (c)=>{return c.name === vote.candidate} )
          old_candidate.votes--
          vote.candidate = candidate.name
        }else {// new vote
          this.votes.push({
            voter: voterName,
            candidate: candidate.name
          })
        }
      }
      var total_votes = this.candidates.reduce( (total,c) => total + c.votes,0)
      for(var i in this.candidates) {
        this.candidates[i].percentage = (this.candidates[i].votes * 100 / total_votes).toFixed(2) + ' %'
      }

      this.searchingVotes = false
      this.hideInfo()
      this.showSuccess('Reading finished')
    },

    filterOperations( block, templates ){
      var operations = []
      for(var i in block.transactions){
        var tx = block.transactions[i]
        for(var j in tx.operations) {
          var op = tx.operations[j]
          var template = templates.find( function(t){
            if(t[0]!==op[0]) return false
            for(var i in t[1]){
              var field = t[1][i]
              //todo: add support to regexp
              if(op[1][i] !== t[1][i]) return false 
            }
            return true
          })
          if(template) {
            operations.push(op)
          }
        }
      }
      return operations
    },

    async findBlock(time) {
      var target = new Date(time + 'Z')

      var gpo = await this.steem_database_call('get_dynamic_global_properties')
      var b = {
        time: new Date(gpo.time + 'Z'),
        num: gpo.head_block_number
      }

      if(target > b.time){
        var error = new Error('The block for time '+time+' doesn\'t exist yet. Current time: '+gpo.time)
        error.name = 'FutureBlock'
        error.gpo = gpo
        throw error
      }

      var i=20
      while( b.time.getTime() !== target.getTime() && i>0){
        var blocknum = b.num - Math.round((b.time - target)/1000/3)
        var block = await this.steem_database_call('get_block',[blocknum])

        b.time = new Date(block.timestamp + 'Z')

        b.num = blocknum
        i--
      }

      if(i==0)
        throw new Error('More than 20 iterations trying to find the block number of '+time+'. Best try: '+b.time.toISOString().slice(0, -5)+' blocknumber:'+b.num)
      return blocknum     
    },

    async publish() {
      this.sending = true
      this.hideSuccess()
      this.hideDanger()

      try{
        if(!this.$store.state.auth.logged)
          throw new Error('Please login')

        var username = this.$store.state.auth.user
        var privKey = this.$store.state.auth.keys.posting

        var json = {
          candidate: candidate.name
        }
        var operation = [
          'custom_json',
          {
            required_auths: [],
            required_posting_auths: [username],
            id: 'elections-2019',
            json: JSON.stringify(json)
          }
        ]
        var result = await this.steem_broadcast_sendOperations([operation], privKey)
        this.showSuccess('<a href="'+Config.EXPLORER+'b/'+result.block_num+'/'+result.id+'" class="alert-link" target="_blank">Results published!</a>')
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
