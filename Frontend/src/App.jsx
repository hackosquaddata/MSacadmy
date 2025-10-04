import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CourseDashboard from './pages/CourseDashboard';
import CourseDetails from './pages/CourseDetails';
import AdminDashboard from './pages/AdminDashboard';
import CreateCourse from './pages/CreateCourse';
import CourseContentUpload from './pages/Admincourseuplaod';
import ProtectedRoute from './components/ProtectedRoute';
import CourseContent from './pages/CourseContent';
import PaymentSuccess from './pages/PaymentSuccess';
import MyLearning from './pages/MyLearning';
import UserProfile from './pages/UserProfile';
import EditCourse from './pages/Editcourse'

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          (() => {
            const token = localStorage.getItem('token');
            if (!token) return <Navigate to="/login" replace />;
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.is_admin === true ? 
              <Navigate to="/admin/dashboard" replace /> : 
              <Navigate to="/dashboard" replace />;
          })()
        } />
        <Route path="/login" element={
          localStorage.getItem('token') ? 
          <Navigate to="/dashboard" replace /> : 
          <Login />
        } />
        <Route path="/signup" element={
          localStorage.getItem('token') ? 
          <Navigate to="/dashboard" replace /> : 
          <Signup />
        } />

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
          path="/courses/:courseId"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/learn"
          element={
            <ProtectedRoute>
              <CourseContent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-learning"
          element={
            <ProtectedRoute>
              <MyLearning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-course" // Changed from /admin/courses/create
          element={
            <ProtectedRoute adminOnly={true}>
              <CreateCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:courseId/upload"
          element={
            <ProtectedRoute adminOnly={true}>
              <CourseContentUpload />
            </ProtectedRoute>
          }
        />

         <Route
          path="/admin/course/:courseId/edit"
          element={
            <ProtectedRoute adminOnly={true}>
              <EditCourse />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;