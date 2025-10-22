import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { apiUrl } from '../lib/api';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  let storedUser = {};
  try {
    const raw = localStorage.getItem('user');
    storedUser = raw ? JSON.parse(raw) : {};
  } catch {
    storedUser = {};
  }
  const location = useLocation();
  // Handle both data structures (nested user object and direct user data)
  const user = storedUser.user || storedUser;
  console.log('Protected Route - User Data:', user);
  console.log('Protected Route - Admin Status:', user.is_admin);

  useEffect(() => {
    // Validate token on mount
    if (token) {
      fetch(apiUrl('/api/auth/v1/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      .then(async res => {
        if (!res.ok) {
          // Token is invalid, clear storage
          localStorage.clear();
          window.location.href = '/login';
        } else {
          // Update stored user data
          const data = await res.json();
          console.log('Fetched fresh user data:', data);
          // Store the user object directly
          localStorage.setItem('user', JSON.stringify(data.user || data));
        }
      })
      .catch(() => {
        // Error validating token, clear storage
        localStorage.clear();
        window.location.href = '/login';
      });
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin routes
  if (adminOnly && user?.is_admin !== true) {
    console.log('Non-admin trying to access admin route');
    console.log('Current user data:', user);
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect admins trying to access regular user routes
  if (!adminOnly && user?.is_admin === true && location.pathname.startsWith('/dashboard')) {
    console.log('Admin trying to access user route');
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;