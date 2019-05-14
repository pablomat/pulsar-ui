<template>
  <div>
    <HeaderEFTG :showAuth="false" ref="headerEFTG"></HeaderEFTG>
    <div class="container">
      <h2 class="text-center mb-4">Easy payment system</h2>
      <div class="row">
        <div class="offset-md-1 col-md-4">
          <router-link to="/menu" class="card no-a mb-3">
            <img class="card-img-top" src="">
            <div class="card-body row">
              <div class="col-4 text-center">
                <router-link to="/menu" class="text-primary"><font-awesome-icon icon="cocktail" size="4x"/></router-link>
              </div>
              <div class="col-8">
                <h5 class="card-title">Menu</h5>
                <p class="card-text">See the menu and order!</p>
              </div>
            </div>
          </router-link>
          <router-link to="/barman" class="card no-a mb-3">
            <div class="card-body row">
              <div class="col-4 text-center">
                <router-link to="/barman" class="text-primary"><font-awesome-icon icon="user-astronaut" size="4x"/></router-link>              
              </div>
              <div class="col-8">
                <h5 class="card-title">Barman</h5>
                <p class="card-text">Admin page for the barman.</p>
              </div>
            </div>
          </router-link>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <Map :showBlocks="false" :showLegend="false" :showTitles="false"></Map>
            </div>
          </div>
        </div>
      </div>
    </div>            
  </div>
</template>

<script>
import HeaderEFTG from '@/components/HeaderEFTG'
import Map from '@/components/Map'

export default {
  name: "Home",
  
  components: {
    HeaderEFTG,
    Map
  },
} 
</script>
