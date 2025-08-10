import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import UserDashboard from './pages/UserDashboard'
import FormBuilder from './pages/FormBuilder'
import FormPreview from './pages/FormPreview'
import FormFill from './pages/FormFill'
import FormResponses from './pages/FormResponses'
import ResponseDetails from './pages/ResponseDetails'
import NotFound from './components/NotFound'

function App() {
  return (
    <AuthProvider>
      <DndProvider backend={HTML5Backend}>
        <Router>
          <div className="App">
            <Toaster position="top-right" />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } />
              <Route path="/register" element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              } />
              <Route path="/form/:shareId" element={<FormFill />} />
              <Route path="/form/id/:formId" element={<FormFill />} />
              <Route path="/form/formid/:formId" element={<FormFill />} />
              {/* Catch-all route for any other form patterns */}
              <Route path="/form/*" element={<FormFill />} />

              {/* Protected routes - Role-based routing */}
              <Route path="/" element={
                <ProtectedRoute>
                  <RoleBasedDashboard />
                </ProtectedRoute>
              } />
              
              {/* Admin-only routes */}
              <Route path="/builder/:id?" element={
                <ProtectedRoute requireAdmin={true}>
                  <FormBuilder />
                </ProtectedRoute>
              } />
              <Route path="/preview/:id" element={
                <ProtectedRoute requireAdmin={true}>
                  <FormPreview />
                </ProtectedRoute>
              } />
              <Route path="/form-responses/:formId" element={
                <ProtectedRoute requireAdmin={true}>
                  <FormResponses />
                </ProtectedRoute>
              } />
              <Route path="/response-detail/:responseId" element={
                <ProtectedRoute requireAdmin={true}>
                  <ResponseDetails />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </DndProvider>
    </AuthProvider>
  )
}

// Component to route users based on their role
const RoleBasedDashboard = () => {
  const { user } = useAuth()
  
  if (user?.role === 'admin') {
    return <Dashboard />
  } else {
    return <UserDashboard />
  }
}

export default App