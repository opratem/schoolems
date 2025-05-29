import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { customRender, mockAuthUser, mockAdminUser } from '../test-utils';
import NavigationBar from '../../components/NavigationBar';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

describe('NavigationBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Unauthenticated User', () => {
    it('should not render navigation for unauthenticated user', () => {
      customRender(<NavigationBar />);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  describe('Employee User', () => {
    it('should render appropriate navigation items for employee', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/leave requests/i)).toBeInTheDocument();
      expect(screen.getByText(/profile/i)).toBeInTheDocument();

      // Employee should not see admin-only items
      expect(screen.queryByText(/employees/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/users/i)).not.toBeInTheDocument();
    });

    it('should highlight active navigation item', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const dashboardLink = screen.getByText(/dashboard/i);
      expect(dashboardLink).toHaveClass('active'); // Assuming active class exists
    });

    it('should navigate when clicking navigation items', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const leaveRequestsLink = screen.getByText(/leave requests/i);
      fireEvent.click(leaveRequestsLink);

      expect(mockNavigate).toHaveBeenCalledWith('/leave-requests');
    });
  });

  describe('Admin User', () => {
    it('should render all navigation items for admin', () => {
      customRender(<NavigationBar />, { initialUser: mockAdminUser });

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/employees/i)).toBeInTheDocument();
      expect(screen.getByText(/leave requests/i)).toBeInTheDocument();
      expect(screen.getByText(/users/i)).toBeInTheDocument();
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    it('should show admin badge or indicator', () => {
      customRender(<NavigationBar />, { initialUser: mockAdminUser });

      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });
  });

  describe('Manager User', () => {
    it('should render appropriate navigation items for manager', () => {
      const managerUser = { ...mockAuthUser, role: 'MANAGER' as const };
      customRender(<NavigationBar />, { initialUser: managerUser });

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/employees/i)).toBeInTheDocument();
      expect(screen.getByText(/leave requests/i)).toBeInTheDocument();
      expect(screen.getByText(/profile/i)).toBeInTheDocument();

      // Manager should not see user management
      expect(screen.queryByText(/users/i)).not.toBeInTheDocument();
    });
  });

  describe('User Profile Dropdown', () => {
    it('should show user information in dropdown', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      // Click on user profile dropdown trigger
      const profileDropdown = screen.getByTestId('user-profile-dropdown');
      fireEvent.click(profileDropdown);

      expect(screen.getByText(mockAuthUser.username)).toBeInTheDocument();
      expect(screen.getByText(mockAuthUser.role)).toBeInTheDocument();
    });

    it('should show logout option in dropdown', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const profileDropdown = screen.getByTestId('user-profile-dropdown');
      fireEvent.click(profileDropdown);

      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    it('should logout user when clicking logout', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const profileDropdown = screen.getByTestId('user-profile-dropdown');
      fireEvent.click(profileDropdown);

      const logoutButton = screen.getByText(/logout/i);
      fireEvent.click(logoutButton);

      // Should navigate to login page
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Mobile Navigation', () => {
    it('should show mobile menu toggle on small screens', () => {
      // Mock window.innerWidth to simulate mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const mobileToggle = screen.getByTestId('mobile-menu-toggle');
      expect(mobileToggle).toBeInTheDocument();
    });

    it('should toggle mobile menu when clicking toggle button', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const mobileToggle = screen.getByTestId('mobile-menu-toggle');
      fireEvent.click(mobileToggle);

      const mobileMenu = screen.getByTestId('mobile-menu');
      expect(mobileMenu).toHaveClass('open');
    });
  });

  describe('Notifications', () => {
    it('should show notification bell for pending leave requests (admin)', () => {
      customRender(<NavigationBar />, { initialUser: mockAdminUser });

      const notificationBell = screen.getByTestId('notifications');
      expect(notificationBell).toBeInTheDocument();
    });

    it('should show notification count when there are pending items', () => {
      customRender(<NavigationBar />, { initialUser: mockAdminUser });

      // Assuming there are pending notifications
      const notificationCount = screen.getByTestId('notification-count');
      expect(notificationCount).toBeInTheDocument();
    });

    it('should not show notifications for regular employees', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      expect(screen.queryByTestId('notifications')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for tablet screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('tablet-layout');
    });

    it('should show compact navigation for small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('compact');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should support keyboard navigation', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const firstLink = screen.getByText(/dashboard/i);
      firstLink.focus();

      fireEvent.keyDown(firstLink, { key: 'Tab' });

      const secondLink = screen.getByText(/leave requests/i);
      expect(secondLink).toHaveFocus();
    });

    it('should announce current page to screen readers', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const currentPage = screen.getByRole('link', { current: 'page' });
      expect(currentPage).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should apply dark theme when selected', () => {
      customRender(<NavigationBar />, { initialUser: mockAuthUser });

      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('dark-theme');
    });
  });
});
