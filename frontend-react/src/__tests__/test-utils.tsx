import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock AuthUser for testing
export const mockAuthUser = {
  username: 'testuser',
  role: 'EMPLOYEE' as const,
  token: 'mock-jwt-token',
  employeeId: 1,
  expiresAt: Date.now() + 3600000, // 1 hour from now
};

export const mockAdminUser = {
  username: 'admin',
  role: 'ADMIN' as const,
  token: 'mock-admin-jwt-token',
  employeeId: 2,
  expiresAt: Date.now() + 3600000,
};

// Custom render function that includes necessary providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: any;
  routerProps?: any;
}

const AllTheProviders = ({ children, initialUser }: { children: React.ReactNode; initialUser?: any }) => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: jest.fn((key: string) => {
      if (initialUser) {
        switch (key) {
          case 'token': return initialUser.token;
          case 'username': return initialUser.username;
          case 'role': return initialUser.role;
          case 'employeeId': return initialUser.employeeId?.toString();
          case 'expiresAt': return initialUser.expiresAt?.toString();
        }
      }
      return null;
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  // Mock localStorage globally for this test
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialUser, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders initialUser={initialUser}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock axios for API testing
export const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

// Common test data
export const mockEmployees = [
  {
    id: 1,
    name: 'John Doe',
    employeeId: 'EMP001',
    department: 'IT',
    position: 'Developer',
    contactInfo: 'john@example.com',
    startDate: '2023-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    employeeId: 'EMP002',
    department: 'HR',
    position: 'Manager',
    contactInfo: 'jane@example.com',
    startDate: '2022-06-01',
  },
];

export const mockLeaveRequests = [
  {
    id: 1,
    leaveType: 'ANNUAL',
    startDate: '2024-02-01',
    endDate: '2024-02-05',
    reason: 'Vacation',
    status: 'PENDING',
    employee: mockEmployees[0],
  },
  {
    id: 2,
    leaveType: 'SICK',
    startDate: '2024-01-15',
    endDate: '2024-01-17',
    reason: 'Flu',
    status: 'APPROVED',
    employee: mockEmployees[1],
  },
];

// Utility functions for tests
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

export * from '@testing-library/react';
export { customRender as render };
