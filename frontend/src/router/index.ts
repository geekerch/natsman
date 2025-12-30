import { createRouter, createWebHashHistory } from 'vue-router'
import RequestsView from '../views/RequestsView.vue'
import JetStreamView from '../views/JetStreamView.vue'

const routes = [
  { path: '/', redirect: '/requests' },
  { path: '/requests', component: RequestsView },
  { path: '/jetstream', component: JetStreamView },
  // Add other routes as placeholders
  { path: '/pubsub', component: { template: '<div>Pub/Sub (Coming Soon)</div>' } },
  { path: '/kv', component: { template: '<div>KV Store (Coming Soon)</div>' } },
  { path: '/settings', component: { template: '<div>Settings (Coming Soon)</div>' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
