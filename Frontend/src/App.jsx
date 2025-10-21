import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CourseDashboard from './pages/Coursedashboard';
import CourseDetails from './pages/CourseDetails';
import AdminDashboard from './pages/AdminDashboard';
import CreateCourse from './pages/CreateCourse';
import CourseContentUpload from './pages/Admincourseuplaod';
import ProtectedRoute from './components/ProtectedRoute';
import CourseContent from './pages/CourseContent';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentPage from './pages/PaymentPage';
import MyLearning from './pages/MyLearning';
import UserProfile from './pages/UserProfile';
import EditCourse from './pages/Editcourse'
import AdminCourseContent from './pages/AdminCourseContent'; // Import the new component
import AdminManualPayments from './pages/AdminManualPayments';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword'; // Import the ResetPassword component
import PendingPaymentsOverlay from './components/PendingPaymentsOverlay';
import Support from './pages/Support';
import AdminHelp from './pages/AdminHelp';
import AdminCouponUsage from './pages/AdminCouponUsage';
import Footer from './components/Footer';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100 flex flex-col">
        <Toaster position="top-right" />
        <PendingPaymentsOverlay />
        <div className="flex-1">
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} /> {/* Reset password route */}
  <Route path="/terms" element={<Terms />} />
  <Route path="/privacy" element={<Privacy />} />
  <Route path="/about" element={<About />} />
  <Route path="/contact" element={<Contact />} />

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
        {/* Legacy alias: redirect /course/:courseId to /courses/:courseId */}
        <Route path="/course/:courseId" element={<CourseAlias />} />
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
          path="/support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:courseId"
          element={
            <ProtectedRoute>
              <PaymentPage />
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
        <Route
          path="/admin/course/:courseId/content"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminCourseContent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manual-payments"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminManualPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/help"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminHelp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminCouponUsage />
            </ProtectedRoute>
          }
        />
        </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

function CourseAlias() {
  const { courseId } = useParams();
  return <Navigate to={`/courses/${courseId}`} replace />;
}