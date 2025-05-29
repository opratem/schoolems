import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import useSessionTimeout from '../hooks/useSessionTimeout';
import SessionTimeoutDialog from './SessionTimeoutDialog';

interface SessionManagerProps {
  children: React.ReactNode;
}

export default function SessionManager({ children }: SessionManagerProps) {
  const { user, logout } = useAuth();

  const {
    isWarningShown,
    timeRemaining,
    extendSession,
  } = useSessionTimeout({
    timeoutDuration: 30 * 60 * 1000, // 30 minutes
    warningDuration: 5 * 60 * 1000,  // 5 minutes warning
    onTimeout: () => {
      logout();
      // Could also show a notification or redirect to login
      console.log('Session timed out due to inactivity');
    },
    onWarning: () => {
      console.log('Session timeout warning triggered');
    },
  });

  return (
    <>
      {children}

      {user && (
        <SessionTimeoutDialog
          open={isWarningShown}
          timeRemaining={timeRemaining}
          onExtendSession={extendSession}
          onLogout={logout}
        />
      )}
    </>
  );
}
