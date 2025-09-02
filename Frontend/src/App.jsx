import './App.css'
import { BrowserRouter as Router , Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CourseDashboard from './pages/Coursedashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {


  return (
   <Router>

    <Routes>

      <Route path="/" element={<Navigate to="/login" replace />}/>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <CourseDashboard />
            </ProtectedRoute>
          } 
        />
    </Routes>
   
   </Router>
  )
}

export default App
