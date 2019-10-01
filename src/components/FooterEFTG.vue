<template>
  <footer class="footer bg-primary text-light" style="min-height:2.5rem;">
    <div class="container-fluid">
      <div class="row pt-2 pb-2">
        <div class="col-6 text-left"><small><a href="https://github.com/pablomat/pulsar-ui/" target="_blank"><img src="../assets/logo-github.png" style="height: 20px; vertical-align:sub;" class="mr-1"/></a>Pulsar-UI — AEGIS — version {{version}}</small></div>
        <div class="col-6 text-right"><small>Developed by bwl.lu<a href="http://bwl.lu/" target="_blank"><img src="https://static.wixstatic.com/media/61f4a4_01ebe798ba8d44dc82e25c97ec564715~mv2.png/v1/fill/w_114,h_40,al_c,q_80,usm_0.66_1.00_0.01/bwl_edited.webp" style="height: 20px;"/></a></small></div>
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
