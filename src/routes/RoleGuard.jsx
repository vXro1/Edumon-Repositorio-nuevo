// src/routes/RoleGuard.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../features/auth/context/AuthContext';

export const RoleGuard = ({ roles = [] }) => {
  const { user, loading } = useAuthContext();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const has = roles.length === 0 || roles.includes(user?.rol || user?.role);
  return has ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleGuard;
