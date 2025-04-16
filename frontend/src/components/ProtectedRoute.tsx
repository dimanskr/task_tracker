import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresModeration?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = true,
  requiresModeration = false,
}) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const hasModeratorAccess = isModerator || isSuperuser;

  if (!isAuthenticated && requiresAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresModeration && !hasModeratorAccess) {
    return <Navigate to="/" state={{ message: 'У вас нет прав для выполнения этого действия' }} replace />;
  }

  return <>{children}</>;
}; 