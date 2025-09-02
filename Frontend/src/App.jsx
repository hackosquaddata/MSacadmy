import './App.css'
import { BrowserRouter as Router , Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CourseDashboard from './pages/CourseDashboard'
import CourseDetails from './pages/CourseDetails'
import AdminDashboard from './pages/AdminDashboard'
import CreateCourse from './pages/CreateCourse'
import ProtectedRoute from './components/ProtectedRoute'

function App() {


  return (
   <Router>

    <Routes>

      <Route path="/" element={<Navigate to="/login" replace />}/>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><CourseDashboard /></ProtectedRoute>} />
      <Route path="/course/:courseId" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/create-course" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
    </Routes>
   
   </Router>
  )
}

export default App
