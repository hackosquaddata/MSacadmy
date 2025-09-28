import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CourseDashboard from './pages/CourseDashboard';
import CourseDetails from './pages/CourseDetails';
import AdminDashboard from './pages/AdminDashboard';
import CreateCourse from './pages/CreateCourse';
import CourseContentUpload from './pages/Admincourseuplaod';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes for regular users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CourseDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:courseId"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-course"
          element={
            <ProtectedRoute adminOnly={true}>
              <CreateCourse editMode={false} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/course/:courseId/edit"
          element={
            <ProtectedRoute adminOnly={true}>
              <CreateCourse editMode={true} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/courses/:courseId/upload" // Change from :id to :courseId
          element={
            <ProtectedRoute adminOnly={true}>
              <CourseContentUpload />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;