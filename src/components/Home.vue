<template>
  <div>
    <HeaderEFTG :showAuth="false" ref="headerEFTG"></HeaderEFTG>
    <div class="container">
      <h1 class="mb-4">{{UNIVERSITY_NAME}}</h1>
      <h3>Your road to employment</h3>
    </div>
    <div class="container bg-landpage">
    </div>            
  </div>
</template>

<script>
import HeaderEFTG from '@/components/HeaderEFTG'

export default {
  name: "Home",

  data(){
    return {
      UNIVERSITY_NAME: process.env.VUE_APP_UNIVERSITY_NAME
    }
  },

  components: {
    HeaderEFTG
  },
} 
</script>

<style>
.bg-landpage{
  background-image: url("https://www.smartcompany.com.au/content/uploads/2019/08/Yu-Dan-Shi-WEB.jpg");
  background-color: #cccccc;
  background-size: cover;
  height: 60vh;
}

.no-a{
  color: #2c3e50;
}
.no-a:hover{
  text-decoration: none;
  color: #0F5494;
}
</style>
