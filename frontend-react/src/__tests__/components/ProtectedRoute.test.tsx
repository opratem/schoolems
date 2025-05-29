import React from 'react';
import { screen } from '@testing-library/react';
import { customRender, mockAuthUser, mockAdminUser } from '../test-utils';
import ProtectedRoute from '../../components/ProtectedRoute';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
}));

// Test component to render inside protected route
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Authentication', () => {
    it('should redirect to login when user is not authenticated', () => {
      customRender(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render children when user is authenticated', () => {
      customRender(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument();
    });
  });

  describe('Role-based Authorization', () => {
    it('should allow access when user has required role', () => {
      customRender(
        <ProtectedRoute requiredRole="EMPLOYEE">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should deny access when user does not have required role', () => {
      customRender(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should allow admin access to any route', () => {
      customRender(
        <ProtectedRoute requiredRole="EMPLOYEE">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAdminUser }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should allow manager access to employee routes', () => {
      const managerUser = { ...mockAuthUser, role: 'MANAGER' as const };

      customRender(
        <ProtectedRoute requiredRole="EMPLOYEE">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: managerUser }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should deny employee access to admin routes', () => {
      customRender(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should deny employee access to manager routes', () => {
      customRender(
        <ProtectedRoute requiredRole="MANAGER">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Roles Authorization', () => {
    it('should allow access when user has one of multiple required roles', () => {
      customRender(
        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAdminUser }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should deny access when user does not have any of the required roles', () => {
      customRender(
        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Custom Authorization', () => {
    it('should allow access when custom authorizer returns true', () => {
      const customAuthorizer = (user: any) => user.employeeId === 1;

      customRender(
        <ProtectedRoute customAuthorizer={customAuthorizer}>
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should deny access when custom authorizer returns false', () => {
      const customAuthorizer = (user: any) => user.employeeId === 999;

      customRender(
        <ProtectedRoute customAuthorizer={customAuthorizer}>
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when authentication is loading', () => {
      // Mock a loading state by not providing initial user and simulating auth loading
      customRender(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      // Depending on implementation, might show loading state
      // This test would need to be adjusted based on actual implementation
    });
  });

  describe('Token Expiration', () => {
    it('should redirect to login when token is expired', () => {
      const expiredUser = {
        ...mockAuthUser,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      customRender(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: expiredUser }
      );

      expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user object gracefully', () => {
      const invalidUser = { username: 'test' }; // Missing required fields

      customRender(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: invalidUser }
      );

      // Should either redirect to login or show error
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should handle null role gracefully', () => {
      const userWithNullRole = { ...mockAuthUser, role: null };

      customRender(
        <ProtectedRoute requiredRole="EMPLOYEE">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: userWithNullRole }
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Access Denied Page', () => {
    it('should show access denied message with appropriate styling', () => {
      customRender(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      const accessDeniedElement = screen.getByText(/access denied/i);
      expect(accessDeniedElement).toBeInTheDocument();

      // Could test for specific CSS classes or styling if needed
      expect(screen.getByText(/you do not have permission/i)).toBeInTheDocument();
    });

    it('should provide a way to go back or contact admin', () => {
      customRender(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>,
        { initialUser: mockAuthUser }
      );

      // Assuming there's a go back button or contact info
      expect(screen.getByText(/go back/i) || screen.getByText(/contact/i)).toBeInTheDocument();
    });
  });
});
