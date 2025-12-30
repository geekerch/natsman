import { createRouter, createWebHashHistory } from 'vue-router'
import RequestsView from '../views/RequestsView.vue'
import JetStreamView from '../views/JetStreamView.vue'
import PubSubView from '../views/PubSubView.vue'
import KVView from '../views/KVView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  { path: '/', redirect: '/requests' },
  { path: '/requests', component: RequestsView },
  { path: '/jetstream', component: JetStreamView },
  { path: '/pubsub', component: PubSubView },
  { path: '/kv', component: KVView },
  { path: '/settings', component: SettingsView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
