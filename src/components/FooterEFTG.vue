<template>
  <footer class="footer bg-primary text-light" style="min-height:2.5rem;">
    <div class="container-fluid">
      <div class="row pt-2 pb-2">
        <div class="col-6 text-left"><small><a href="https://github.com/pablomat/pulsar-ui/" target="_blank"><img src="../assets/logo-github.png" style="height: 20px;" class="mr-1 align-bottom"/></a>Pulsar-UI — EFTG — version {{version}}</small></div>
      </div>
    </div>
  </footer>
</template>

<script>
import Config from '@/config.js'

export default {
  name: 'FooterEFTG',
  data() {
    return {
      version: Config.APP_VERSION.substring(7)
    }
  },

  created() {
    var debug = true
    if(debug){
      console.log('RPC NODE: '+this.$store.state.rpc_node)
    }
  }
} 
</script>

<style>

</style>