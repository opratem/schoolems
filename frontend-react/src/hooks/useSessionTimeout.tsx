import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SessionTimeoutConfig {
  timeoutDuration: number; // in milliseconds
  warningDuration: number; // time before timeout to show warning
  onTimeout?: () => void;
  onWarning?: () => void;
}

interface SessionTimeoutState {
  isWarningShown: boolean;
  timeRemaining: number;
  extendSession: () => void;
  isActive: boolean;
}

export default function useSessionTimeout({
  timeoutDuration = 30 * 60 * 1000, // 30 minutes default
  warningDuration = 5 * 60 * 1000, // 5 minutes warning default
  onTimeout,
  onWarning,
}: SessionTimeoutConfig): SessionTimeoutState {
  const { user, logout } = useAuth();
  const [isWarningShown, setIsWarningShown] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeoutDuration);
  const [isActive, setIsActive] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(() => {
    clearAllTimers();
    setIsWarningShown(false);
    setIsActive(false);

    // Call custom timeout handler
    if (onTimeout) {
      onTimeout();
    } else {
      logout();
    }
  }, [clearAllTimers, logout, onTimeout]);

  const showWarning = useCallback(() => {
    setIsWarningShown(true);
    setTimeRemaining(warningDuration);

    // Start countdown
    countdownRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          handleTimeout();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Call custom warning handler
    if (onWarning) {
      onWarning();
    }

    // Set final timeout
    timeoutRef.current = setTimeout(handleTimeout, warningDuration);
  }, [warningDuration, handleTimeout, onWarning]);

  const resetTimers = useCallback(() => {
    if (!user) return;

    clearAllTimers();
    setIsWarningShown(false);
    setTimeRemaining(timeoutDuration);
    lastActivityRef.current = Date.now();

    // Set warning timer
    warningRef.current = setTimeout(showWarning, timeoutDuration - warningDuration);
  }, [user, clearAllTimers, timeoutDuration, warningDuration, showWarning]);

  const extendSession = useCallback(() => {
    resetTimers();
    setIsActive(true);
  }, [resetTimers]);

  // Activity detection
  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setIsActive(false);
      return;
    }

    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Only reset if significant time has passed (avoid excessive resets)
      if (timeSinceLastActivity > 60000) { // 1 minute
        resetTimers();
      }
      lastActivityRef.current = now;
    };

    // Add event listeners for user activity
    activities.forEach(activity => {
      document.addEventListener(activity, handleActivity, true);
    });

    // Initialize timers
    resetTimers();
    setIsActive(true);

    return () => {
      // Cleanup
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity, true);
      });
      clearAllTimers();
      setIsActive(false);
    };
  }, [user, resetTimers, clearAllTimers]);

  // Check for token expiration from localStorage
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiration = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          handleTimeout();
          return;
        }

        // Check if token is expired (if you store expiration time)
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
          handleTimeout();
          return;
        }
      } catch (error) {
        console.warn('Error checking token expiration:', error);
      }
    };

    // Check immediately and then every minute
    checkTokenExpiration();
    const intervalId = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(intervalId);
  }, [user, handleTimeout]);

  return {
    isWarningShown,
    timeRemaining,
    extendSession,
    isActive,
  };
}
