import { createRouter, createWebHashHistory } from 'vue-router'
import { EROUTE } from '@/../electron/enums'
const routes = [
  {
    path: '/',
    name: EROUTE.ROOT,
    redirect: '/home',
  },
  {
    path: '/home',
    name: EROUTE.HOME,
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/read',
    name: EROUTE.READ,
    component: () => import('@/views/read/index.vue'),
  },
  {
    path:'/search',
    name:EROUTE.SEARCH,
    component:()=>import('@/views/search/index.vue')
  }
]
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
