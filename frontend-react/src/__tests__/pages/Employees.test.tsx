import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, mockAxios, mockAdminUser, mockEmployees } from '../test-utils';
import Employees from '../../pages/Employees';

// Mock axios
jest.mock('../../api/axios', () => mockAxios);

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Employees Component', () => {
  const user = userEvent.setup();
  const managerUser = { ...mockAdminUser, role: 'MANAGER' as const };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.get.mockClear();
    mockAxios.post.mockClear();
    mockAxios.put.mockClear();
    mockAxios.delete.mockClear();
  });

  describe('Data Loading', () => {
    it('should render employees list for admin', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });

      customRender(<Employees />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/employee management/i)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('EMP001')).toBeInTheDocument();
        expect(screen.getByText('IT')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/employees');
    });

    it('should render employees list for manager', async () => {
      const teamMembers = mockEmployees.filter(emp => emp.department === 'IT');
      mockAxios.get.mockResolvedValueOnce({ data: teamMembers });

      customRender(<Employees />, { initialUser: managerUser });

      await waitFor(() => {
        expect(screen.getByText(/team members/i)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/employees/team');
    });

    it('should show loading state while fetching employees', () => {
      const neverResolvingPromise = new Promise(() => {});
      mockAxios.get.mockReturnValueOnce(neverResolvingPromise);

      customRender(<Employees />, { initialUser: mockAdminUser });

      expect(screen.getByTestId('employees-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading employees/i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('API Error'));

      customRender(<Employees />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/error loading employees/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Employee Table', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display employee information in table format', () => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText(/employee id/i)).toBeInTheDocument();
      expect(screen.getByText(/name/i)).toBeInTheDocument();
      expect(screen.getByText(/department/i)).toBeInTheDocument();
      expect(screen.getByText(/position/i)).toBeInTheDocument();
      expect(screen.getByText(/contact/i)).toBeInTheDocument();
      expect(screen.getByText(/start date/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });

    it('should sort employees by column', async () => {
      const nameHeader = screen.getByText(/name/i);
      await user.click(nameHeader);

      // Check if sorting indicator is shown
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Click again for descending sort
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('should filter employees by department', async () => {
      const departmentFilter = screen.getByLabelText(/filter by department/i);
      await user.selectOptions(departmentFilter, 'IT');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should search employees by name', async () => {
      const searchInput = screen.getByPlaceholderText(/search employees/i);
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should show employee details on row click', async () => {
      const employeeRow = screen.getByTestId('employee-row-1');
      await user.click(employeeRow);

      expect(screen.getByTestId('employee-details-modal')).toBeInTheDocument();
      expect(screen.getByText(/employee details/i)).toBeInTheDocument();
    });
  });

  describe('Employee Actions (Admin Only)', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should show add employee button for admin', () => {
      expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument();
    });

    it('should open add employee modal', async () => {
      const addButton = screen.getByRole('button', { name: /add employee/i });
      await user.click(addButton);

      expect(screen.getByTestId('add-employee-modal')).toBeInTheDocument();
      expect(screen.getByText(/add new employee/i)).toBeInTheDocument();
    });

    it('should edit employee information', async () => {
      const editButton = screen.getByTestId('edit-employee-1');
      await user.click(editButton);

      expect(screen.getByTestId('edit-employee-modal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should delete employee with confirmation', async () => {
      const deleteButton = screen.getByTestId('delete-employee-1');
      await user.click(deleteButton);

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      expect(mockAxios.delete).toHaveBeenCalledWith('/api/employees/1');
    });

    it('should handle successful employee deletion', async () => {
      mockAxios.delete.mockResolvedValueOnce({ data: { message: 'Employee deleted' } });

      const deleteButton = screen.getByTestId('delete-employee-1');
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/employee deleted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Employee Form', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add employee/i });
      await user.click(addButton);
    });

    it('should render employee form fields', () => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/employee id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const submitButton = screen.getByRole('button', { name: /save employee/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/employee id is required/i)).toBeInTheDocument();
      });
    });

    it('should create new employee successfully', async () => {
      const newEmployee = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        employeeId: 'EMP003',
        department: 'Marketing',
        position: 'Specialist',
        startDate: '2024-03-01',
      };

      mockAxios.post.mockResolvedValueOnce({
        data: {
          id: 3,
          name: 'Alice Johnson',
          ...newEmployee
        }
      });

      // Fill form
      await user.type(screen.getByLabelText(/first name/i), newEmployee.firstName);
      await user.type(screen.getByLabelText(/last name/i), newEmployee.lastName);
      await user.type(screen.getByLabelText(/email/i), newEmployee.email);
      await user.type(screen.getByLabelText(/employee id/i), newEmployee.employeeId);
      await user.selectOptions(screen.getByLabelText(/department/i), newEmployee.department);
      await user.type(screen.getByLabelText(/position/i), newEmployee.position);
      await user.type(screen.getByLabelText(/start date/i), newEmployee.startDate);

      const submitButton = screen.getByRole('button', { name: /save employee/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith('/api/employees', {
          firstName: newEmployee.firstName,
          lastName: newEmployee.lastName,
          email: newEmployee.email,
          employeeId: newEmployee.employeeId,
          department: newEmployee.department,
          position: newEmployee.position,
          startDate: newEmployee.startDate,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/employee created successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle duplicate employee ID error', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: {
          data: { message: 'Employee ID already exists' },
          status: 409,
        },
      });

      // Fill minimal required fields
      await user.type(screen.getByLabelText(/first name/i), 'Alice');
      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/employee id/i), 'EMP001'); // Existing ID

      const submitButton = screen.getByRole('button', { name: /save employee/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/employee id already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should select multiple employees', async () => {
      const checkbox1 = screen.getByTestId('employee-checkbox-1');
      const checkbox2 = screen.getByTestId('employee-checkbox-2');

      await user.click(checkbox1);
      await user.click(checkbox2);

      expect(checkbox1).toBeChecked();
      expect(checkbox2).toBeChecked();
      expect(screen.getByText(/2 employees selected/i)).toBeInTheDocument();
    });

    it('should select all employees', async () => {
      const selectAllCheckbox = screen.getByTestId('select-all-employees');
      await user.click(selectAllCheckbox);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should export selected employees data', async () => {
      const checkbox1 = screen.getByTestId('employee-checkbox-1');
      await user.click(checkbox1);

      const exportButton = screen.getByRole('button', { name: /export selected/i });
      await user.click(exportButton);

      // Mock export functionality would be tested here
      expect(screen.getByText(/exporting employee data/i)).toBeInTheDocument();
    });

    it('should bulk delete employees', async () => {
      const checkbox1 = screen.getByTestId('employee-checkbox-1');
      const checkbox2 = screen.getByTestId('employee-checkbox-2');

      await user.click(checkbox1);
      await user.click(checkbox2);

      const deleteButton = screen.getByRole('button', { name: /delete selected/i });
      await user.click(deleteButton);

      expect(screen.getByTestId('bulk-delete-confirmation')).toBeInTheDocument();
      expect(screen.getByText(/delete 2 employees/i)).toBeInTheDocument();
    });
  });

  describe('Permissions', () => {
    it('should hide admin actions for manager users', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: managerUser });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /add employee/i })).not.toBeInTheDocument();
        expect(screen.queryByTestId('delete-employee-1')).not.toBeInTheDocument();
      });
    });

    it('should allow managers to view employee details', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: managerUser });

      await waitFor(() => {
        expect(screen.getByTestId('view-employee-1')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt table for mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: mockAdminUser });

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

      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByTestId('employees-card-view')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValueOnce({ data: mockEmployees });
      customRender(<Employees />, { initialUser: mockAdminUser });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should have proper table headers and ARIA labels', () => {
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Employees table');

      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should support keyboard navigation', async () => {
      const firstRow = screen.getByTestId('employee-row-1');
      firstRow.focus();

      await user.keyboard('{Tab}');
      const editButton = screen.getByTestId('edit-employee-1');
      expect(editButton).toHaveFocus();
    });

    it('should announce table changes to screen readers', async () => {
      const searchInput = screen.getByPlaceholderText(/search employees/i);
      await user.type(searchInput, 'John');

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/showing 1 of 2 employees/i);
    });
  });

  describe('Performance', () => {
    it('should implement pagination for large datasets', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockEmployees[0],
        id: i + 1,
        name: `Employee ${i + 1}`,
        employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
      }));

      mockAxios.get.mockResolvedValueOnce({
        data: {
          employees: largeDataset.slice(0, 10),
          total: 100,
          page: 1,
          totalPages: 10,
        }
      });

      customRender(<Employees />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
        expect(screen.getByText(/page 1 of 10/i)).toBeInTheDocument();
      });
    });

    it('should handle pagination navigation', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockEmployees[0],
        id: i + 1,
        name: `Employee ${i + 1}`,
      }));

      mockAxios.get
        .mockResolvedValueOnce({
          data: {
            employees: largeDataset.slice(0, 10),
            total: 100,
            page: 1,
            totalPages: 10,
          }
        })
        .mockResolvedValueOnce({
          data: {
            employees: largeDataset.slice(10, 20),
            total: 100,
            page: 2,
            totalPages: 10,
          }
        });

      customRender(<Employees />, { initialUser: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('Employee 1')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Employee 11')).toBeInTheDocument();
        expect(mockAxios.get).toHaveBeenCalledWith('/api/employees?page=2&limit=10');
      });
    });
  });
});
