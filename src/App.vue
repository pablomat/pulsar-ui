<template>
  <div id="app">
    <router-view style="min-height:calc(100vh - 2.5rem);">
    </router-view>
    <FooterEFTG></FooterEFTG>
  </div>
</template>

<script>
import FooterEFTG from "@/components/FooterEFTG";

export default {
  name: "App",
  components: {
    FooterEFTG
  }
};
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Roboto&display=swap');
</style>
