import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'project',
        name: 'Project',
        component: () => import('../views/Project.vue')
      },
      {
        path: 'feature/:projectId/:branch',
        name: 'Feature',
        component: () => import('../views/Feature.vue')
      },
      {
        path: 'supplier',
        name: 'Supplier',
        component: () => import('../views/Supplier.vue')
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('../views/User.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('pm_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
