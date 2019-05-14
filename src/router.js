import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home
    },
    {
      path: "/menu",
      name: "MenuPage",
      component: () => import('./views/MenuPage.vue')
    },
    {
      path: "/barman",
      name: "BarmanPage",
      component: () => import('./views/BarmanPage.vue')
    },
    {
      path: "/map",
      name: "MapPage",
      component: () => import('./views/MapPage.vue')
    },
    {
      path: "/contact",
      name: "Contact",
      component: () => import('./views/ContactPage.vue')
    },
    {
      path: "/password",
      name: "Password",
      component: () => import('./views/PasswordPage.vue')
    },
    {
      path: "/witnesses",
      name: "Witnesses",
      component: () => import('./views/WitnessesPage.vue')
    },
    {
      path: "/explorer",
      name: "Explorer",
      component: () => import('./components/explorer/Home.vue')
    },
    {
      path: '/explorer/@:account',
      name: 'Account',
      component: () => import('./components/explorer/Account.vue')
    },{
      path: '/explorer/@:account/:permlink',
      name: 'Post',
      component: () => import('./components/explorer/Post.vue')
    },{
      path: '/explorer/b/:id',
      name: 'Block',
      component: () => import('./components/explorer/Block.vue')
    },{
      path: '/explorer/b/:id/:tx',
      name: 'Transaction',
      component: () => import('./components/explorer/Transaction.vue')
    },{
      path: '*',
      name: 'Page404',
      component: () => import('./views/Page404.vue')
    }
  ]
})
