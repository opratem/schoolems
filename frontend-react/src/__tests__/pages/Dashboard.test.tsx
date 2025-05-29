import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, mockAxios, mockAuthUser, mockAdminUser, mockLeaveRequests, mockEmployees } from '../test-utils';
import Dashboard from '../../pages/Dashboard';

// Mock axios
jest.mock('../../api/axios', () => mockAxios);

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.get.mockClear();
    mockNavigate.mockClear();
  });

  describe('Employee Dashboard', () => {
    it('should render employee dashboard with basic stats', async () => {
      const mockStats = {
        totalLeaveRequests: 5,
        approvedLeaves: 3,
        pendingLeaves: 2,
        availableLeaves: 15,
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockStats });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/welcome back, testuser/i)).toBeInTheDocument();
        expect(screen.getByText(/total leave requests/i)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(/approved leaves/i)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText(/pending leaves/i)).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText(/available leaves/i)).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/dashboard/employee-stats');
    });

    it('should display recent leave requests for employee', async () => {
      const recentLeaves = mockLeaveRequests.slice(0, 3);

      mockAxios.get
        .mockResolvedValueOnce({ data: { totalLeaveRequests: 5 } })
        .mockResolvedValueOnce({ data: recentLeaves });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/recent leave requests/i)).toBeInTheDocument();
        expect(screen.getByText('Vacation')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/leave-requests/my-recent');
    });

    it('should show quick action buttons for employee', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: { totalLeaveRequests: 5 } });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit leave request/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /view my requests/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /view calendar/i })).toBeInTheDocument();
      });
    });

    it('should navigate to leave request submission', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: { totalLeaveRequests: 5 } });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      const submitButton = await screen.findByRole('button', { name: /submit leave request/i });
      await user.click(submitButton);

      expect(mockNavigate).toHaveBeenCalledWith('/leave-request/submit');
    });
  });

  describe('Admin Dashboard', () => {
    it('should render admin dashboard with comprehensive stats', async () => {
      const mockAdminStats = {
        totalEmployees: 25,
        pendingRequests: 8,
        approvedThisMonth: 12,
        departmentBreakdown: {
          IT: 10,
          HR: 5,
          Finance: 10,
        },
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockAdminStats });

      customRender(<Dashboard />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/total employees/i)).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText(/pending requests/i)).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText(/approved this month/i)).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/dashboard/admin-stats');
    });

    it('should display pending requests requiring attention', async () => {
      const pendingRequests = mockLeaveRequests.filter(req => req.status === 'PENDING');

      mockAxios.get
        .mockResolvedValueOnce({ data: { pendingRequests: 8 } })
        .mockResolvedValueOnce({ data: pendingRequests });

      customRender(<Dashboard />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/requests requiring attention/i)).toBeInTheDocument();
        expect(screen.getByText('Vacation')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/leave-requests/pending');
    });

    it('should show admin action buttons', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: { pendingRequests: 8 } });

      customRender(<Dashboard />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /manage employees/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /review requests/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /generate reports/i })).toBeInTheDocument();
      });
    });

    it('should display department breakdown chart', async () => {
      const mockStats = {
        departmentBreakdown: {
          IT: 10,
          HR: 5,
          Finance: 10,
        },
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockStats });

      customRender(<Dashboard />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/department breakdown/i)).toBeInTheDocument();
        expect(screen.getByTestId('department-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Manager Dashboard', () => {
    it('should render manager dashboard with team stats', async () => {
      const managerUser = { ...mockAuthUser, role: 'MANAGER' as const };
      const mockManagerStats = {
        teamMembers: 8,
        teamPendingRequests: 3,
        teamApprovedThisMonth: 5,
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockManagerStats });

      customRender(<Dashboard />, { initialUser: managerUser });

      await waitFor(() => {
        expect(screen.getByText(/team dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/team members/i)).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText(/team pending requests/i)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/dashboard/manager-stats');
    });
  });

  describe('Data Loading and Error Handling', () => {
    it('should show loading state while fetching data', () => {
      const neverResolvingPromise = new Promise(() => {});
      mockAxios.get.mockReturnValueOnce(neverResolvingPromise);

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('API Error'));

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry data fetching on error', async () => {
      mockAxios.get
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ data: { totalLeaveRequests: 5 } });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle empty data gracefully', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: {} });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh data automatically', async () => {
      jest.useFakeTimers();

      mockAxios.get.mockResolvedValue({ data: { totalLeaveRequests: 5 } });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      // Wait for initial load
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledTimes(1);
      });

      // Fast forward time to trigger refresh
      jest.advanceTimersByTime(30000); // 30 seconds

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      mockAxios.get.mockResolvedValueOnce({ data: { totalLeaveRequests: 5 } });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        const dashboard = screen.getByTestId('dashboard');
        expect(dashboard).toHaveClass('mobile-layout');
      });
    });

    it('should stack cards vertically on tablet', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      mockAxios.get.mockResolvedValueOnce({ data: { totalLeaveRequests: 5 } });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        const dashboard = screen.getByTestId('dashboard');
        expect(dashboard).toHaveClass('tablet-layout');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: { totalLeaveRequests: 5 } });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toHaveAttribute('aria-label', 'Dashboard');

        const statsRegion = screen.getByRole('region', { name: /statistics/i });
        expect(statsRegion).toBeInTheDocument();
      });
    });

    it('should announce dynamic content changes', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: { totalLeaveRequests: 5 } });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Performance', () => {
    it('should implement virtual scrolling for large datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockLeaveRequests[0],
        id: i,
        reason: `Request ${i}`,
      }));

      mockAxios.get
        .mockResolvedValueOnce({ data: { totalLeaveRequests: 1000 } })
        .mockResolvedValueOnce({ data: largeDataset });

      customRender(<Dashboard />, { initialUser: mockAdminUser });

      await waitFor(() => {
        const virtualList = screen.getByTestId('virtual-list');
        expect(virtualList).toBeInTheDocument();
      });
    });
  });

  describe('Notifications', () => {
    it('should show notification for new pending requests (admin)', async () => {
      const statsWithNotifications = {
        pendingRequests: 8,
        newRequestsCount: 2,
      };

      mockAxios.get.mockResolvedValueOnce({ data: statsWithNotifications });

      customRender(<Dashboard />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/2 new requests/i)).toBeInTheDocument();
        expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
      });
    });

    it('should show deadline reminders for employees', async () => {
      const statsWithDeadlines = {
        totalLeaveRequests: 5,
        upcomingDeadlines: [
          { type: 'Leave Request Response', date: '2024-02-15' },
        ],
      };

      mockAxios.get.mockResolvedValueOnce({ data: statsWithDeadlines });

      customRender(<Dashboard />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/upcoming deadlines/i)).toBeInTheDocument();
        expect(screen.getByText(/leave request response/i)).toBeInTheDocument();
      });
    });
  });
});
