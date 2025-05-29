import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, mockAxios, mockAuthUser } from '../test-utils';
import LeaveRequestSubmit from '../../pages/LeaveRequestSubmit';

// Mock axios
jest.mock('../../api/axios', () => mockAxios);

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: undefined }), // For new request
}));

describe('LeaveRequestSubmit Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.get.mockClear();
    mockAxios.post.mockClear();
    mockAxios.put.mockClear();
    mockNavigate.mockClear();
  });

  describe('Form Rendering', () => {
    it('should render leave request form', () => {
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      expect(screen.getByText(/submit leave request/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/leave type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    });

    it('should show available leave types', () => {
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      const leaveTypeSelect = screen.getByLabelText(/leave type/i);
      expect(leaveTypeSelect).toBeInTheDocument();

      // Check for common leave types
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      expect(screen.getByText('Personal Leave')).toBeInTheDocument();
      expect(screen.getByText('Maternity/Paternity Leave')).toBeInTheDocument();
    });

    it('should show remaining leave balance', async () => {
      const mockBalance = {
        annual: 15,
        sick: 10,
        personal: 5,
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockBalance });

      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/remaining balance/i)).toBeInTheDocument();
        expect(screen.getByText(/annual: 15 days/i)).toBeInTheDocument();
        expect(screen.getByText(/sick: 10 days/i)).toBeInTheDocument();
        expect(screen.getByText(/personal: 5 days/i)).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/leave-balance/my');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });
    });

    it('should validate required fields', async () => {
      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/leave type is required/i)).toBeInTheDocument();
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
        expect(screen.getByText(/end date is required/i)).toBeInTheDocument();
        expect(screen.getByText(/reason is required/i)).toBeInTheDocument();
      });
    });

    it('should validate start date is not in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      await user.selectOptions(screen.getByLabelText(/leave type/i), 'ANNUAL');
      await user.type(screen.getByLabelText(/start date/i), yesterdayString);

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start date cannot be in the past/i)).toBeInTheDocument();
      });
    });

    it('should validate end date is after start date', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const todayString = today.toISOString().split('T')[0];
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      await user.selectOptions(screen.getByLabelText(/leave type/i), 'ANNUAL');
      await user.type(screen.getByLabelText(/start date/i), tomorrowString);
      await user.type(screen.getByLabelText(/end date/i), todayString);

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
      });
    });

    it('should validate sufficient leave balance', async () => {
      const mockBalance = { annual: 2, sick: 10, personal: 5 };
      mockAxios.get.mockResolvedValueOnce({ data: mockBalance });

      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/annual: 2 days/i)).toBeInTheDocument();
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4); // 5 days total (more than balance)

      await user.selectOptions(screen.getByLabelText(/leave type/i), 'ANNUAL');
      await user.type(screen.getByLabelText(/start date/i), startDate.toISOString().split('T')[0]);
      await user.type(screen.getByLabelText(/end date/i), endDate.toISOString().split('T')[0]);

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/insufficient leave balance/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum notice period', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      await user.selectOptions(screen.getByLabelText(/leave type/i), 'ANNUAL');
      await user.type(screen.getByLabelText(/start date/i), tomorrowString);

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/minimum 2 weeks notice required/i)).toBeInTheDocument();
      });
    });

    it('should validate maximum leave duration', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 15); // 2 weeks notice
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30); // 31 days total

      await user.selectOptions(screen.getByLabelText(/leave type/i), 'ANNUAL');
      await user.type(screen.getByLabelText(/start date/i), startDate.toISOString().split('T')[0]);
      await user.type(screen.getByLabelText(/end date/i), endDate.toISOString().split('T')[0]);

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/maximum 30 consecutive days allowed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      const mockBalance = { annual: 15, sick: 10, personal: 5 };
      mockAxios.get.mockResolvedValueOnce({ data: mockBalance });
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/annual: 15 days/i)).toBeInTheDocument();
      });
    });

    it('should submit valid leave request successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          message: 'Leave request submitted successfully',
        },
      };

      mockAxios.post.mockResolvedValueOnce(mockResponse);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 15);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4);

      // Fill form
      await user.selectOptions(screen.getByLabelText(/leave type/i), 'ANNUAL');
      await user.type(screen.getByLabelText(/start date/i), startDate.toISOString().split('T')[0]);
      await user.type(screen.getByLabelText(/end date/i), endDate.toISOString().split('T')[0]);
      await user.type(screen.getByLabelText(/reason/i), 'Family vacation');

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith('/api/leave-requests', {
          leaveType: 'ANNUAL',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          reason: 'Family vacation',
          employeeId: mockAuthUser.employeeId,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/leave request submitted successfully/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/leave-requests');
      });
    });

    it('should handle submission errors', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: {
          data: { message: 'Conflict with existing leave request' },
          status: 409,
        },
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 15);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);

      await user.selectOptions(screen.getByLabelText(/leave type/i), 'ANNUAL');
      await user.type(screen.getByLabelText(/start date/i), startDate.toISOString().split('T')[0]);
      await user.type(screen.getByLabelText(/end date/i), endDate.toISOString().split('T')[0]);
      await user.type(screen.getByLabelText(/reason/i), 'Personal leave');

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/conflict with existing leave request/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      let resolveSubmission: (value: any) => void;
      const submissionPromise = new Promise(resolve => {
        resolveSubmission = resolve;
      });

      mockAxios.post.mockReturnValueOnce(submissionPromise);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 15);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);

      await user.selectOptions(screen.getByLabelText(/leave type/i), 'ANNUAL');
      await user.type(screen.getByLabelText(/start date/i), startDate.toISOString().split('T')[0]);
      await user.type(screen.getByLabelText(/end date/i), endDate.toISOString().split('T')[0]);
      await user.type(screen.getByLabelText(/reason/i), 'Personal leave');

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      expect(screen.getByText(/submitting request/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      resolveSubmission!({ data: { message: 'Success' } });

      await waitFor(() => {
        expect(screen.queryByText(/submitting request/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Calendar Integration', () => {
    beforeEach(async () => {
      const mockBalance = { annual: 15, sick: 10, personal: 5 };
      mockAxios.get.mockResolvedValueOnce({ data: mockBalance });
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/annual: 15 days/i)).toBeInTheDocument();
      });
    });

    it('should show calendar view for date selection', async () => {
      const calendarToggle = screen.getByRole('button', { name: /calendar view/i });
      await user.click(calendarToggle);

      expect(screen.getByTestId('date-picker-calendar')).toBeInTheDocument();
    });

    it('should highlight selected date range on calendar', async () => {
      const calendarToggle = screen.getByRole('button', { name: /calendar view/i });
      await user.click(calendarToggle);

      const calendar = screen.getByTestId('date-picker-calendar');
      const startDateCell = screen.getByTestId('calendar-date-15');
      await user.click(startDateCell);

      const endDateCell = screen.getByTestId('calendar-date-17');
      await user.click(endDateCell);

      expect(startDateCell).toHaveClass('selected-start');
      expect(endDateCell).toHaveClass('selected-end');
    });

    it('should show existing leave requests on calendar', async () => {
      const existingRequests = [
        {
          startDate: '2024-02-20',
          endDate: '2024-02-22',
          status: 'APPROVED',
          employee: { id: 2 },
        },
      ];

      mockAxios.get.mockImplementationOnce((url) => {
        if (url.includes('leave-requests/calendar')) {
          return Promise.resolve({ data: existingRequests });
        }
        return Promise.resolve({ data: { annual: 15, sick: 10, personal: 5 } });
      });

      const calendarToggle = screen.getByRole('button', { name: /calendar view/i });
      await user.click(calendarToggle);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-date-20')).toHaveClass('has-leave');
      });
    });
  });

  describe('Edit Mode', () => {
    const existingRequest = {
      id: 1,
      leaveType: 'ANNUAL',
      startDate: '2024-02-15',
      endDate: '2024-02-17',
      reason: 'Family vacation',
      status: 'PENDING',
    };

    beforeEach(() => {
      // Mock edit mode by providing request ID
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: '1' }),
      }));
    });

    it('should load existing request data in edit mode', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: existingRequest })
        .mockResolvedValueOnce({ data: { annual: 15, sick: 10, personal: 5 } });

      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/edit leave request/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Family vacation')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/leave-requests/1');
    });

    it('should update existing request on submission', async () => {
      mockAxios.get
        .mockResolvedValueOnce({ data: existingRequest })
        .mockResolvedValueOnce({ data: { annual: 15, sick: 10, personal: 5 } });

      mockAxios.put.mockResolvedValueOnce({
        data: { message: 'Leave request updated successfully' },
      });

      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Family vacation')).toBeInTheDocument();
      });

      const reasonInput = screen.getByLabelText(/reason/i);
      await user.clear(reasonInput);
      await user.type(reasonInput, 'Updated vacation plans');

      const submitButton = screen.getByRole('button', { name: /update request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/api/leave-requests/1', {
          leaveType: 'ANNUAL',
          startDate: '2024-02-15',
          endDate: '2024-02-17',
          reason: 'Updated vacation plans',
        });
      });
    });

    it('should prevent editing approved/rejected requests', async () => {
      const approvedRequest = { ...existingRequest, status: 'APPROVED' };

      mockAxios.get
        .mockResolvedValueOnce({ data: approvedRequest })
        .mockResolvedValueOnce({ data: { annual: 15, sick: 10, personal: 5 } });

      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/this request cannot be edited/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update request/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('File Attachments', () => {
    beforeEach(async () => {
      const mockBalance = { annual: 15, sick: 10, personal: 5 };
      mockAxios.get.mockResolvedValueOnce({ data: mockBalance });
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/annual: 15 days/i)).toBeInTheDocument();
      });
    });

    it('should allow file uploads for sick leave', async () => {
      await user.selectOptions(screen.getByLabelText(/leave type/i), 'SICK');

      expect(screen.getByText(/attach medical certificate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/upload file/i)).toBeInTheDocument();
    });

    it('should validate file types', async () => {
      await user.selectOptions(screen.getByLabelText(/leave type/i), 'SICK');

      const fileInput = screen.getByLabelText(/upload file/i);
      const invalidFile = new File(['content'], 'document.exe', { type: 'application/exe' });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('should validate file size', async () => {
      await user.selectOptions(screen.getByLabelText(/leave type/i), 'SICK');

      const fileInput = screen.getByLabelText(/upload file/i);
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file size too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-save Functionality', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      const mockBalance = { annual: 15, sick: 10, personal: 5 };
      mockAxios.get.mockResolvedValueOnce({ data: mockBalance });
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/annual: 15 days/i)).toBeInTheDocument();
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-save form data as draft', async () => {
      await user.type(screen.getByLabelText(/reason/i), 'Family vacation');

      // Fast forward time to trigger auto-save
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'leave-request-draft',
          expect.stringContaining('Family vacation')
        );
      });
    });

    it('should restore draft data on page load', () => {
      const draftData = {
        leaveType: 'ANNUAL',
        reason: 'Previously entered reason',
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(draftData));

      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      expect(screen.getByDisplayValue('Previously entered reason')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      const mockBalance = { annual: 15, sick: 10, personal: 5 };
      mockAxios.get.mockResolvedValueOnce({ data: mockBalance });
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        expect(screen.getByText(/annual: 15 days/i)).toBeInTheDocument();
      });
    });

    it('should have proper form labels and ARIA attributes', () => {
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Leave request form');

      expect(screen.getByLabelText(/leave type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    });

    it('should announce validation errors to screen readers', async () => {
      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation', async () => {
      const leaveTypeSelect = screen.getByLabelText(/leave type/i);
      leaveTypeSelect.focus();

      await user.keyboard('{Tab}');
      const startDateInput = screen.getByLabelText(/start date/i);
      expect(startDateInput).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt form layout for mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const mockBalance = { annual: 15, sick: 10, personal: 5 };
      mockAxios.get.mockResolvedValueOnce({ data: mockBalance });
      customRender(<LeaveRequestSubmit />, { initialUser: mockAuthUser });

      await waitFor(() => {
        const form = screen.getByRole('form');
        expect(form).toHaveClass('mobile-form');
      });
    });
  });
});
