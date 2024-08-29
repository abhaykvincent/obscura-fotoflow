import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';// Adjust the path as needed
import { selectIsAuthenticated, selectUser } from '../../app/slices/authSlice';

const AdminRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated || user.email !== 'abhaykvincent@gmail.com') {
    return <Navigate to="/" replace />; // Redirect to the home page or login if not authorized
  }

  return children;
};

export default AdminRoute;
