import axios from 'axios'
import Config from '@/config.js'
import router from '@/router.js'

export default {
  
  data: function(){
    return {
    }
  },
  
  methods: {

    async login(username, password) {
      var response
      var user

      if(process.env.VUE_APP_DEV){
        var response = {
          data: { 
            username: process.env.VUE_APP_DEV_USERNAME,
            profile: {
              name: 'example',
              family_name: 'family',
              address: 'Luxembourg',
              image: 'https://steemitimages.com/DQmb2HNSGKN3pakguJ4ChCRjgkVuDN9WniFRPmrxoJ4sjR4'
            },
            logged: true
          }
        }
      }else if(!username && !password){
        response = await axios.get(Config.SERVER_API + 'login')
      }else{
        response = await axios.post(Config.SERVER_API + "login", {username, password})
        router.push(Config.PAGE_AFTER_LOGIN)
      }
      user = this.setLoginUser(response.data)
      return user
    },

    async logout() {
      if(!process.env.VUE_APP_DEV)
        await axios.get(Config.SERVER_API + "logout")
      console.log(this.$store.state.auth.username + " logout");

      this.$store.state.auth = { user: '', logged: false, imgUrl: '' }
      router.push(Config.PAGE_AFTER_LOGOUT)
    },

    async signup(username, password, profile) {
      var response = await axios.post(Config.SERVER_API + 'signup', {username, password, profile})
      return response.data
    },

    setLoginUser(user){
      console.log('Logged in as '+user.username)
      if(!user.profile || !user.profile.image || user.profile.image==='')
        user.profile.image = 'https://steemitimages.com/DQmb2HNSGKN3pakguJ4ChCRjgkVuDN9WniFRPmrxoJ4sjR4'
      user.logged = true
      this.$store.state.auth = user
      return user
    }
  }
}
