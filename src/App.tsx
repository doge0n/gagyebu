import { HashRouter, Route, Routes } from 'react-router'
import { BottomNav } from './components/BottomNav'
import { Toaster } from './components/Toast'
import { CalendarPage } from './features/calendar/CalendarPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TripDetailPage } from './features/trips/TripDetailPage'
import { TripsPage } from './features/trips/TripsPage'
import { WeeklyPage } from './features/weekly/WeeklyPage'
import { useApplyTheme } from './lib/useTheme'

export default function App() {
  useApplyTheme()
  return (
    <HashRouter>
      <main>
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/weekly" element={<WeeklyPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <Toaster />
      <BottomNav />
    </HashRouter>
  )
}
