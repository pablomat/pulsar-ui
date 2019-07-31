import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import OAMEntryPage from '@/components/OAMEntryPage'
import SearchPage from '@/components/SearchPage'
import MapPage from '@/components/MapPage'
import Faq from '@/components/Faq'
import Contact from '@/components/Contact'
import Password from '@/components/Password'
import Witnesses from '@/components/Witnesses'
import Page404 from '@/components/Page404'

// Explorer
import HomeExplorer from '@/components/explorer/Home'
import AccountExplorer from '@/components/explorer/Account'
import PostExplorer from '@/components/explorer/Post'
import BlockExplorer from '@/components/explorer/Block'
import TransactionExplorer from '@/components/explorer/Transaction'

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
      path: "/map",
      name: "MapPage",
      component: MapPage
    },
    {
      path: "/password",
      name: "Password",
      component: Password
    },
    {
      path: "/witnesses",
      name: "Witnesses",
      component: Witnesses
    },
    {
      path: "/publish",
      name: "Publish",
      component: () => import('./views/PublishPage.vue')
    },
    {
      path: "/createaccount",
      name: "CreateAccount",
      component: () => import('./views/CreateAccount.vue')
    },
    {
      path: "/explorer",
      name: "Explorer",
      component: HomeExplorer
    },
    {
      path: '/explorer/@:account',
      name: 'Account',
      component: AccountExplorer
    },{
      path: '/explorer/@:account/:permlink',
      name: 'Post',
      component: PostExplorer
    },{
      path: '/explorer/b/:id',
      name: 'Block',
      component: BlockExplorer
    },{
      path: '/explorer/b/:id/:tx',
      name: 'Transaction',
      component: TransactionExplorer
    },{
      path: '*',
      name: 'Page404',
      component: Page404
    }
  ]
})
