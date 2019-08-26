<template>
  <div>
    <HeaderEFTG :showAuth="false" ref="headerEFTG"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center mb-4">AEGIS</h2>
      <div class="row">
        <div class="offset-md-1 col-md-4">
          <router-link to="/publish" class="card no-a mb-3">
            <img class="card-img-top" src="">
            <div class="card-body row">
              <div class="col-4 text-center">
                <router-link to="/publish" class="text-primary"><font-awesome-icon icon="certificate" size="4x"/></router-link>
              </div>
              <div class="col-8">
                <h5 class="card-title">Publish</h5>
                <p class="card-text">For private or public entities that want to register their intellectual property products (algorithms, methods, processes, results).</p>
              </div>
            </div>
          </router-link>
          <router-link to="/market" class="card no-a mb-3">
            <div class="card-body row">
              <div class="col-4 text-center">
                <router-link to="/market" class="text-primary"><font-awesome-icon icon="search" size="4x"/></router-link>              
              </div>
              <div class="col-8">
                <h5 class="card-title">Market</h5>
                <p class="card-text">For private or public entities that want to search for and use already existing/registered products (algorithms, methods, processes, results).</p>
              </div>
            </div>
          </router-link>
        </div>
        <div class="col-md-6">
          <div class="text-center"><vimeo-player video-id="354021809"></vimeo-player></div>
        </div>
      </div>
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
