import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import RequestsPage from './pages/RequestsPage'
import PubSubPage from './pages/PubSubPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import JetStreamPage from './pages/JetStreamPage'
import KVStorePage from './pages/KVStorePage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<RequestsPage />} />
          <Route path="/pubsub" element={<PubSubPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/jetstream" element={<JetStreamPage />} />
          <Route path="/kv" element={<KVStorePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
