<template>
  <div>
    <HeaderEFTG :showAuth="false" ref="headerEFTG"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center mb-4">PULSAR</h2>
      <div class="text-center"><vimeo-player video-id="354021809"></vimeo-player></div>
      <p class="mt-5 text-justify">AEGIS is a solution to the outstanding challenges of protecting copyright in Earth Observation (EO) cloud-based algorithms, software, tools and data. It is an innovative blockchain platform that provides integrity, traceability, automated certification and auditability of EO data and information.</p>
      <h3>Demo</h3>
      <p>To test the application log in with the following account:</p>
      <ul>
        <li>Username: demo</li>
        <li>Password: demo</li>
      </ul>
      <p>Now you can go to the market and buy a registered certified application.</p>
    </div>
  </div>
</template>

<script>
import HeaderEFTG from '@/components/HeaderEFTG'
import Map from '@/components/Map'
import Vue from 'vue'
import VueYouTubeEmbed from 'vue-youtube-embed'
import vueVimeoPlayer from 'vue-vimeo-player'

Vue.use(VueYouTubeEmbed)
Vue.use(vueVimeoPlayer)

export default {
  name: "Home",
  
  components: {
    HeaderEFTG,
    Map
  },
} 
</script>

<style>
.no-a{
  color: #2c3e50;
}
.no-a:hover{
  text-decoration: none;
  color: #0F5494;
}
</style>
