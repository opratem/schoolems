import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, mockAxios, mockAuthUser, mockAdminUser, mockLeaveRequests } from '../test-utils';
import LeaveRequests from '../../pages/LeaveRequests';

// Mock axios
jest.mock('../../api/axios', () => mockAxios);

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LeaveRequests Component', () => {
  const user = userEvent.setup();
  const managerUser = { ...mockAuthUser, role: 'MANAGER' as const };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.get.mockClear();
    mockAxios.put.mockClear();
    mockAxios.post.mockClear();
    mockAxios.delete.mockClear();
  });

  describe('Data Loading', () => {
    it('should render leave requests for employee (own requests)', async () => {
      const employeeRequests = mockLeaveRequests.filter(req => req.employee.id === mockAuthUser.employeeId);
      mockAxios.get.mockResolvedValueOnce({ data: employeeRequests });

      customRender(<LeaveRequests />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/my leave requests/i)).toBeInTheDocument();
        expect(screen.getByText('Vacation')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/leave-requests/my');
    });

    it('should render all leave requests for admin', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });

      customRender(<LeaveRequests />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/all leave requests/i)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/leave-requests');
    });

    it('should render team leave requests for manager', async () => {
      const teamRequests = mockLeaveRequests.filter(req => req.employee.department === 'IT');
      mockAxios.get.mockResolvedValueOnce({ data: teamRequests });

      customRender(<LeaveRequests />, { initialUser: managerUser });

      await waitFor(() => {
        expect(screen.getByText(/team leave requests/i)).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/leave-requests/team');
    });

    it('should show loading state while fetching requests', () => {
      const neverResolvingPromise = new Promise(() => {});
      mockAxios.get.mockReturnValueOnce(neverResolvingPromise);

      customRender(<LeaveRequests />, { initialUser: mockAuthUser });

      expect(screen.getByTestId('leave-requests-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading leave requests/i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('API Error'));

      customRender(<LeaveRequests />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/error loading leave requests/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Leave Requests Table', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display leave request information in table format', () => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText(/employee/i)).toBeInTheDocument();
      expect(screen.getByText(/leave type/i)).toBeInTheDocument();
      expect(screen.getByText(/start date/i)).toBeInTheDocument();
      expect(screen.getByText(/end date/i)).toBeInTheDocument();
      expect(screen.getByText(/reason/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });

    it('should sort requests by column', async () => {
      const statusHeader = screen.getByText(/status/i);
      await user.click(statusHeader);

      expect(statusHeader).toHaveAttribute('aria-sort', 'ascending');

      await user.click(statusHeader);
      expect(statusHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('should filter requests by status', async () => {
      const statusFilter = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(statusFilter, 'PENDING');

      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.queryByText('APPROVED')).not.toBeInTheDocument();
      });
    });

    it('should filter requests by leave type', async () => {
      const typeFilter = screen.getByLabelText(/filter by leave type/i);
      await user.selectOptions(typeFilter, 'ANNUAL');

      await waitFor(() => {
        expect(screen.getByText('ANNUAL')).toBeInTheDocument();
        expect(screen.queryByText('SICK')).not.toBeInTheDocument();
      });
    });

    it('should search requests by employee name', async () => {
      const searchInput = screen.getByPlaceholderText(/search requests/i);
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should filter requests by date range', async () => {
      const startDateFilter = screen.getByLabelText(/from date/i);
      const endDateFilter = screen.getByLabelText(/to date/i);

      await user.type(startDateFilter, '2024-02-01');
      await user.type(endDateFilter, '2024-02-28');

      await waitFor(() => {
        // Should show only requests within the date range
        expect(screen.getByText('Vacation')).toBeInTheDocument();
      });
    });
  });

  describe('Request Actions (Admin/Manager)', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should approve pending leave request', async () => {
      mockAxios.put.mockResolvedValueOnce({
        data: { message: 'Leave request approved' }
      });

      const approveButton = screen.getByTestId('approve-request-1');
      await user.click(approveButton);

      expect(screen.getByTestId('approve-confirmation-modal')).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/api/leave-requests/1/approve');
      });

      await waitFor(() => {
        expect(screen.getByText(/leave request approved successfully/i)).toBeInTheDocument();
      });
    });

    it('should reject leave request with reason', async () => {
      mockAxios.put.mockResolvedValueOnce({
        data: { message: 'Leave request rejected' }
      });

      const rejectButton = screen.getByTestId('reject-request-1');
      await user.click(rejectButton);

      expect(screen.getByTestId('reject-confirmation-modal')).toBeInTheDocument();

      const reasonTextarea = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonTextarea, 'Insufficient staffing during requested period');

      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/api/leave-requests/1/reject', {
          reason: 'Insufficient staffing during requested period'
        });
      });
    });

    it('should view detailed request information', async () => {
      const viewButton = screen.getByTestId('view-request-1');
      await user.click(viewButton);

      expect(screen.getByTestId('request-details-modal')).toBeInTheDocument();
      expect(screen.getByText(/leave request details/i)).toBeInTheDocument();
      expect(screen.getByText('Vacation')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle bulk approval of requests', async () => {
      const checkbox1 = screen.getByTestId('request-checkbox-1');
      const checkbox2 = screen.getByTestId('request-checkbox-2');

      await user.click(checkbox1);
      await user.click(checkbox2);

      const bulkApproveButton = screen.getByRole('button', { name: /approve selected/i });
      await user.click(bulkApproveButton);

      expect(screen.getByTestId('bulk-approve-confirmation')).toBeInTheDocument();
      expect(screen.getByText(/approve 2 requests/i)).toBeInTheDocument();
    });
  });

  describe('Employee Actions', () => {
    beforeEach(async () => {
      const employeeRequests = mockLeaveRequests.filter(req => req.employee.id === mockAuthUser.employeeId);
      mockAxios.get.mockResolvedValueOnce({ data: employeeRequests });
      customRender(<LeaveRequests />, { initialUser: mockAuthUser });
      await waitFor(() => {
        expect(screen.getByText('Vacation')).toBeInTheDocument();
      });
    });

    it('should show submit new request button', () => {
      expect(screen.getByRole('button', { name: /submit new request/i })).toBeInTheDocument();
    });

    it('should navigate to submit request page', async () => {
      const submitButton = screen.getByRole('button', { name: /submit new request/i });
      await user.click(submitButton);

      expect(mockNavigate).toHaveBeenCalledWith('/leave-request/submit');
    });

    it('should allow editing pending requests', async () => {
      const editButton = screen.getByTestId('edit-request-1');
      await user.click(editButton);

      expect(screen.getByTestId('edit-request-modal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Vacation')).toBeInTheDocument();
    });

    it('should allow canceling pending requests', async () => {
      const cancelButton = screen.getByTestId('cancel-request-1');
      await user.click(cancelButton);

      expect(screen.getByTestId('cancel-confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to cancel/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm cancel/i });
      await user.click(confirmButton);

      expect(mockAxios.delete).toHaveBeenCalledWith('/api/leave-requests/1');
    });

    it('should not show edit/cancel for approved/rejected requests', () => {
      // This would test the conditional rendering based on request status
      expect(screen.queryByTestId('edit-request-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cancel-request-2')).not.toBeInTheDocument();
    });
  });

  describe('Request Status Display', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display status badges with correct styling', () => {
      const pendingBadge = screen.getByText('PENDING');
      const approvedBadge = screen.getByText('APPROVED');

      expect(pendingBadge).toHaveClass('status-pending');
      expect(approvedBadge).toHaveClass('status-approved');
    });

    it('should show days count for leave requests', () => {
      expect(screen.getByText(/5 days/i)).toBeInTheDocument(); // 2024-02-01 to 2024-02-05
      expect(screen.getByText(/3 days/i)).toBeInTheDocument(); // 2024-01-15 to 2024-01-17
    });

    it('should highlight urgent requests', () => {
      const urgentRequest = screen.getByTestId('request-row-1');
      // If request start date is soon, it should be highlighted
      expect(urgentRequest).toHaveClass('urgent-request');
    });
  });

  describe('Calendar Integration', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should show calendar view toggle', () => {
      expect(screen.getByRole('button', { name: /calendar view/i })).toBeInTheDocument();
    });

    it('should switch to calendar view', async () => {
      const calendarButton = screen.getByRole('button', { name: /calendar view/i });
      await user.click(calendarButton);

      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
      expect(screen.getByText(/february 2024/i)).toBeInTheDocument();
    });

    it('should show requests on calendar dates', async () => {
      const calendarButton = screen.getByRole('button', { name: /calendar view/i });
      await user.click(calendarButton);

      const calendar = screen.getByTestId('calendar-view');
      const requestDate = within(calendar).getByText('1'); // Feb 1st
      expect(requestDate).toHaveClass('has-leave-request');
    });
  });

  describe('Export and Reporting', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should export leave requests data', async () => {
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(screen.getByTestId('export-options-modal')).toBeInTheDocument();
      expect(screen.getByText(/export format/i)).toBeInTheDocument();
    });

    it('should generate leave report', async () => {
      const reportButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(reportButton);

      expect(screen.getByTestId('report-options-modal')).toBeInTheDocument();
      expect(screen.getByLabelText(/report type/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt table for mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveClass('mobile-table');
      });
    });

    it('should show card view on small screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByTestId('requests-card-view')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should have proper table headers and ARIA labels', () => {
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Leave requests table');

      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should support keyboard navigation', async () => {
      const firstRow = screen.getByTestId('request-row-1');
      firstRow.focus();

      await user.keyboard('{Tab}');
      const viewButton = screen.getByTestId('view-request-1');
      expect(viewButton).toHaveFocus();
    });

    it('should announce filter changes to screen readers', async () => {
      const statusFilter = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(statusFilter, 'PENDING');

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/showing 1 of 2 requests/i);
    });
  });

  describe('Performance', () => {
    it('should implement pagination for large datasets', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockLeaveRequests[0],
        id: i + 1,
        reason: `Leave request ${i + 1}`,
      }));

      mockAxios.get.mockResolvedValueOnce({
        data: {
          requests: largeDataset.slice(0, 10),
          total: 100,
          page: 1,
          totalPages: 10,
        }
      });

      customRender(<LeaveRequests />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
        expect(screen.getByText(/page 1 of 10/i)).toBeInTheDocument();
      });
    });

    it('should debounce search input', async () => {
      jest.useFakeTimers();

      mockAxios.get.mockResolvedValueOnce({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search requests/i);
      await user.type(searchInput, 'John');

      // Should not make API call immediately
      expect(mockAxios.get).toHaveBeenCalledTimes(1);

      // Fast forward time to trigger debounced search
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh data when new requests are submitted', async () => {
      jest.useFakeTimers();

      mockAxios.get.mockResolvedValue({ data: mockLeaveRequests });
      customRender(<LeaveRequests />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledTimes(1);
      });

      // Simulate real-time update interval
      jest.advanceTimersByTime(60000); // 1 minute

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });
});
