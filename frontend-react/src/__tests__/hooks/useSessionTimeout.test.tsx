import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { AuthProvider } from '../../contexts/AuthContext';
import { mockAuthUser } from '../test-utils';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
  value: jest.fn(),
  writable: true,
});

// Mock window.addEventListener and removeEventListener
const mockEventListeners: { [key: string]: EventListener[] } = {};
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

beforeAll(() => {
  window.addEventListener = jest.fn((event: string, listener: EventListener) => {
    if (!mockEventListeners[event]) {
      mockEventListeners[event] = [];
    }
    mockEventListeners[event].push(listener);
  });

  window.removeEventListener = jest.fn((event: string, listener: EventListener) => {
    if (mockEventListeners[event]) {
      const index = mockEventListeners[event].indexOf(listener);
      if (index > -1) {
        mockEventListeners[event].splice(index, 1);
      }
    }
  });
});

afterAll(() => {
  window.addEventListener = originalAddEventListener;
  window.removeEventListener = originalRemoveEventListener;
});

// Helper function to simulate user activity
const simulateUserActivity = (eventType: string) => {
  const listeners = mockEventListeners[eventType] || [];
  listeners.forEach(listener => {
    listener(new Event(eventType));
  });
};

// Helper to render hook with AuthProvider
const renderSessionTimeoutHook = (
  initialUser?: any,
  options?: {
    timeoutDuration?: number;
    warningDuration?: number;
    checkInterval?: number;
  }
) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    // Setup initial localStorage values
    if (initialUser) {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'token': return initialUser.token;
          case 'username': return initialUser.username;
          case 'role': return initialUser.role;
          case 'employeeId': return initialUser.employeeId?.toString();
          case 'expiresAt': return initialUser.expiresAt?.toString();
          case 'lastActivity': return Date.now().toString();
          default: return null;
        }
      });
    }

    return <AuthProvider>{children}</AuthProvider>;
  };

  return renderHook(() => useSessionTimeout(options), { wrapper });
};

describe('useSessionTimeout Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLocalStorage.getItem.mockReturnValue(null);
    Object.keys(mockEventListeners).forEach(key => {
      mockEventListeners[key] = [];
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default values when user is not authenticated', () => {
      const { result } = renderSessionTimeoutHook();

      expect(result.current.isActive).toBe(false);
      expect(result.current.showWarning).toBe(false);
      expect(result.current.remainingTime).toBe(0);
    });

    it('should initialize with active session when user is authenticated', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      expect(result.current.isActive).toBe(true);
      expect(result.current.showWarning).toBe(false);
      expect(result.current.remainingTime).toBeGreaterThan(0);
    });

    it('should use custom timeout duration', () => {
      const customTimeout = 60000; // 1 minute
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: customTimeout,
      });

      expect(result.current.remainingTime).toBeLessThanOrEqual(customTimeout);
    });
  });

  describe('Activity Tracking', () => {
    it('should track mouse movements', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      const initialTime = result.current.remainingTime;

      // Fast forward time to simulate inactivity
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.remainingTime).toBeLessThan(initialTime);

      // Simulate mouse movement
      act(() => {
        simulateUserActivity('mousemove');
      });

      // Activity should reset the timer
      expect(result.current.remainingTime).toBeGreaterThan(initialTime - 5000);
    });

    it('should track keyboard activity', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const timeBeforeActivity = result.current.remainingTime;

      act(() => {
        simulateUserActivity('keydown');
      });

      expect(result.current.remainingTime).toBeGreaterThan(timeBeforeActivity);
    });

    it('should track click events', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const timeBeforeActivity = result.current.remainingTime;

      act(() => {
        simulateUserActivity('click');
      });

      expect(result.current.remainingTime).toBeGreaterThan(timeBeforeActivity);
    });

    it('should track scroll events', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const timeBeforeActivity = result.current.remainingTime;

      act(() => {
        simulateUserActivity('scroll');
      });

      expect(result.current.remainingTime).toBeGreaterThan(timeBeforeActivity);
    });

    it('should update localStorage with last activity time', () => {
      renderSessionTimeoutHook(mockAuthUser);

      act(() => {
        simulateUserActivity('click');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lastActivity',
        expect.any(String)
      );
    });
  });

  describe('Warning State', () => {
    it('should show warning when approaching timeout', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: 30000, // 30 seconds
        warningDuration: 10000, // 10 seconds warning
      });

      // Fast forward to warning period
      act(() => {
        jest.advanceTimersByTime(21000); // 21 seconds (9 seconds remaining)
      });

      expect(result.current.showWarning).toBe(true);
      expect(result.current.remainingTime).toBeLessThan(10000);
    });

    it('should hide warning when user becomes active during warning', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: 30000,
        warningDuration: 10000,
      });

      // Trigger warning
      act(() => {
        jest.advanceTimersByTime(21000);
      });

      expect(result.current.showWarning).toBe(true);

      // User becomes active
      act(() => {
        simulateUserActivity('click');
      });

      expect(result.current.showWarning).toBe(false);
    });
  });

  describe('Session Expiration', () => {
    it('should call onTimeout when session expires', () => {
      const onTimeout = jest.fn();
      renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: 10000, // 10 seconds
      });

      // Fast forward past timeout
      act(() => {
        jest.advanceTimersByTime(11000);
      });

      // The hook should trigger logout in AuthContext
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should stop tracking when session expires', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: 10000,
      });

      act(() => {
        jest.advanceTimersByTime(11000);
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.remainingTime).toBe(0);
    });

    it('should send beacon on session expiry for analytics', () => {
      renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: 10000,
      });

      act(() => {
        jest.advanceTimersByTime(11000);
      });

      expect(navigator.sendBeacon).toHaveBeenCalledWith(
        '/api/analytics/session-timeout',
        expect.any(String)
      );
    });
  });

  describe('Manual Session Control', () => {
    it('should allow manual session extension', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: 30000,
      });

      // Advance time
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      const timeBeforeExtension = result.current.remainingTime;

      // Extend session manually
      act(() => {
        result.current.extendSession();
      });

      expect(result.current.remainingTime).toBeGreaterThan(timeBeforeExtension);
    });

    it('should allow manual logout', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isActive).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should pause session timer', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: 30000,
      });

      const initialTime = result.current.remainingTime;

      act(() => {
        result.current.pauseTimer();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Time should not have decreased while paused
      expect(result.current.remainingTime).toBe(initialTime);
    });

    it('should resume session timer', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        timeoutDuration: 30000,
      });

      act(() => {
        result.current.pauseTimer();
      });

      act(() => {
        result.current.resumeTimer();
      });

      const timeAfterResume = result.current.remainingTime;

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.remainingTime).toBeLessThan(timeAfterResume);
    });
  });

  describe('Tab Visibility Handling', () => {
    it('should pause timer when tab becomes hidden', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      const initialTime = result.current.remainingTime;

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });

      act(() => {
        simulateUserActivity('visibilitychange');
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Timer should be paused, so time shouldn't decrease significantly
      expect(result.current.remainingTime).toBe(initialTime);
    });

    it('should resume timer when tab becomes visible', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      // Hide tab
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });

      act(() => {
        simulateUserActivity('visibilitychange');
      });

      // Show tab again
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });

      act(() => {
        simulateUserActivity('visibilitychange');
      });

      const timeAfterShow = result.current.remainingTime;

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.remainingTime).toBeLessThan(timeAfterShow);
    });
  });

  describe('Multiple Tab Synchronization', () => {
    it('should sync session state across tabs using storage events', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'lastActivity',
        newValue: (Date.now() + 5000).toString(),
        oldValue: Date.now().toString(),
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      // Session should be refreshed based on other tab's activity
      expect(result.current.remainingTime).toBeGreaterThan(25000);
    });

    it('should handle logout in other tabs', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser);

      // Simulate logout from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'token',
        newValue: null,
        oldValue: mockAuthUser.token,
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderSessionTimeoutHook(mockAuthUser);

      // Should not crash when localStorage fails
      act(() => {
        simulateUserActivity('click');
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should handle invalid timestamp values', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'lastActivity') return 'invalid-timestamp';
        if (key === 'expiresAt') return 'invalid-timestamp';
        return mockAuthUser[key as keyof typeof mockAuthUser]?.toString() || null;
      });

      const { result } = renderSessionTimeoutHook(mockAuthUser);

      // Should fallback to current time and not crash
      expect(result.current.isActive).toBe(true);
      expect(result.current.remainingTime).toBeGreaterThan(0);
    });

    it('should handle missing user data', () => {
      const incompleteUser = { username: 'test' }; // Missing token and expiresAt

      const { result } = renderSessionTimeoutHook(incompleteUser);

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should throttle activity updates', () => {
      renderSessionTimeoutHook(mockAuthUser);

      // Simulate rapid activity
      act(() => {
        for (let i = 0; i < 10; i++) {
          simulateUserActivity('mousemove');
        }
      });

      // Should not call setItem for every single event
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderSessionTimeoutHook(mockAuthUser);

      const eventCount = Object.values(mockEventListeners).reduce(
        (total, listeners) => total + listeners.length,
        0
      );

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledTimes(eventCount);
    });

    it('should clear intervals on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = renderSessionTimeoutHook(mockAuthUser);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom check interval', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        checkInterval: 2000, // 2 seconds
      });

      const initialTime = result.current.remainingTime;

      // Advance by less than check interval
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Time should not have updated yet
      expect(result.current.remainingTime).toBe(initialTime);

      // Advance past check interval
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      // Now time should have updated
      expect(result.current.remainingTime).toBeLessThan(initialTime);
    });

    it('should allow disabling certain activity types', () => {
      const { result } = renderSessionTimeoutHook(mockAuthUser, {
        trackMouseMovement: false,
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const timeBeforeActivity = result.current.remainingTime;

      // Mouse movement should not reset timer when disabled
      act(() => {
        simulateUserActivity('mousemove');
      });

      expect(result.current.remainingTime).toBe(timeBeforeActivity);

      // But clicks should still work
      act(() => {
        simulateUserActivity('click');
      });

      expect(result.current.remainingTime).toBeGreaterThan(timeBeforeActivity);
    });
  });
});
