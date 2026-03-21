import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectListPage } from './pages/ProjectListPage'
import { FusionListPage } from './pages/FusionListPage'
import { MapPage } from './pages/MapPage'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { Permission } from './constants/permissions'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 公開ルート */}
          <Route path="/login" element={<LoginPage />} />

          {/* 保護ルート */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route
              path="projects"
              element={
                <ProtectedRoute permission={Permission.MANAGE_PROJECT}>
                  <ProjectListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="fusion"
              element={
                <ProtectedRoute permission={Permission.VIEW_FUSION}>
                  <FusionListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="map"
              element={
                <ProtectedRoute permission={Permission.VIEW_MAP}>
                  <MapPage />
                </ProtectedRoute>
              }
            />

            <Route path="403" element={<AccessDeniedPage />} />
          </Route>

          {/* 未定義パス */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
