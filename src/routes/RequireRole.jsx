// src/routes/RequireRole.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../features/auth/context/AuthContext';
import { normalizeRole } from '../roleMatrix';

export const RequireRole = ({ roles = [] }) => {
  const { user, loading } = useAuthContext();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const userRole = normalizeRole(user?.rol || user?.role);
  const allowed = roles.length === 0 || roles.map(r => normalizeRole(r)).includes(userRole);
  return allowed ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RequireRole;
