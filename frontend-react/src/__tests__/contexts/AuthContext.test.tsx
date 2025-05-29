import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { mockAuthUser, mockAdminUser } from '../test-utils';

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

// Helper to render hook with AuthProvider
const renderAuthHook = (initialUser?: any) => {
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
          default: return null;
        }
      });
    }

    return <AuthProvider>{children}</AuthProvider>;
  };

  return renderHook(() => useAuth(), { wrapper });
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with no user when localStorage is empty', () => {
      const { result } = renderAuthHook();

      expect(result.current.user).toBeNull();
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isEmployee).toBe(false);
      expect(result.current.isManager).toBe(false);
    });

    it('should initialize with user from localStorage', () => {
      const { result } = renderAuthHook(mockAuthUser);

      expect(result.current.user).toEqual(mockAuthUser);
      expect(result.current.isEmployee).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
    });

    it('should initialize admin user correctly', () => {
      const { result } = renderAuthHook(mockAdminUser);

      expect(result.current.user).toEqual(mockAdminUser);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isEmployee).toBe(false);
      expect(result.current.isManager).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and update localStorage', () => {
      const { result } = renderAuthHook();

      act(() => {
        result.current.setUser(mockAuthUser);
      });

      expect(result.current.user).toEqual(mockAuthUser);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockAuthUser.token);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('username', mockAuthUser.username);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('role', mockAuthUser.role);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('employeeId', mockAuthUser.employeeId?.toString());
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('expiresAt', mockAuthUser.expiresAt?.toString());
    });

    it('should clear user and localStorage when setting null', () => {
      const { result } = renderAuthHook(mockAuthUser);

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('username');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('role');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('employeeId');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('expiresAt');
    });
  });

  describe('logout', () => {
    it('should clear user and localStorage', () => {
      const { result } = renderAuthHook(mockAuthUser);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('username');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('role');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('employeeId');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('expiresAt');
    });
  });

  describe('Role checking helpers', () => {
    it('should correctly identify admin role', () => {
      const { result } = renderAuthHook(mockAdminUser);

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isManager).toBe(false);
      expect(result.current.isEmployee).toBe(false);
    });

    it('should correctly identify employee role', () => {
      const { result } = renderAuthHook(mockAuthUser);

      expect(result.current.isEmployee).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
    });

    it('should correctly identify manager role', () => {
      const managerUser = { ...mockAuthUser, role: 'MANAGER' as const };
      const { result } = renderAuthHook(managerUser);

      expect(result.current.isManager).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isEmployee).toBe(false);
    });

    it('should return false for all roles when no user', () => {
      const { result } = renderAuthHook();

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
      expect(result.current.isEmployee).toBe(false);
    });
  });

  describe('Token expiration handling', () => {
    it('should auto-logout when token is expired', () => {
      const expiredUser = {
        ...mockAuthUser,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      const { result } = renderAuthHook(expiredUser);

      // User should be automatically logged out due to expired token
      expect(result.current.user).toBeNull();
    });

    it('should keep user logged in when token is not expired', () => {
      const validUser = {
        ...mockAuthUser,
        expiresAt: Date.now() + 3600000, // Expires in 1 hour
      };

      const { result } = renderAuthHook(validUser);

      expect(result.current.user).toEqual(validUser);
    });
  });

  describe('Error handling', () => {
    it('should handle corrupted localStorage gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'valid-token';
        if (key === 'username') return 'testuser';
        if (key === 'role') return 'INVALID_ROLE'; // Invalid role
        return null;
      });

      const { result } = renderAuthHook();

      // Should handle gracefully and not crash
      expect(result.current.user).toBeDefined();
    });

    it('should handle localStorage exceptions', () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();

      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderAuthHook();

      expect(result.current.user).toBeNull();

      console.error = originalConsoleError;
    });
  });
});
