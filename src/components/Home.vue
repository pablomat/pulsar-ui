<template>
  <div>
    <HeaderEFTG :showAuth="false" ref="headerEFTG"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center mb-4">AEGIS</h2>
      <div class="text-center"><vimeo-player video-id="354021809"></vimeo-player></div>
      <p class="mt-5 text-justify">The aegis, as stated in the Iliad, is carried by Athena and Zeus, but its nature is uncertain. It had been interpreted as an animal skin or a shield, sometimes bearing the head of a Gorgon. There may be a connection with a deity named Aex or Aix, a daughter of Helios and a nurse of Zeus or alternatively a mistress of Zeus (Hyginus, Astronomica 2. 13). The aegis of Athena is referred to in several places in the Iliad. "It produced a sound as from a myriad roaring dragons (Iliad, 4.17) and was borne by Athena in battle ... and among them went bright-eyed Athene, holding the precious aegis which is ageless and immortal: a hundred tassels of pure gold hang fluttering from it, tight-woven each of them, and each the worth of a hundred oxen."</p>
<p>The modern concept of doing something "under someone's aegis" means doing something under the protection of a powerful, knowledgeable, or benevolent source. The word aegis is identified with protection by a strong force with its roots in Greek mythology and adopted by the Romans; there are parallels in Norse mythology and in Egyptian mythology as well,[citation needed] where the Greek word aegis is applied by extension.</p>
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
