import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender, mockAxios } from '../test-utils';
import Login from '../../pages/Login';

// Mock axios
jest.mock('../../api/axios', () => mockAxios);

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.post.mockClear();
    mockNavigate.mockClear();
  });

  it('should render login form', () => {
    customRender(<Login />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    customRender(<Login />);

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should handle successful login', async () => {
    const mockLoginResponse = {
      data: {
        token: 'mock-jwt-token',
        username: 'testuser',
        roles: ['EMPLOYEE'],
        employeeId: 1,
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockLoginResponse);

    customRender(<Login />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle login failure with error message', async () => {
    const errorMessage = 'Invalid credentials';
    mockAxios.post.mockRejectedValueOnce({
      response: {
        data: { message: errorMessage },
        status: 401,
      },
    });

    customRender(<Login />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should handle network error', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    customRender(<Login />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });

    mockAxios.post.mockReturnValueOnce(loginPromise);

    customRender(<Login />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Should show loading state
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    expect(loginButton).toBeDisabled();

    // Resolve the promise
    resolveLogin!({
      data: {
        token: 'mock-token',
        username: 'testuser',
        roles: ['EMPLOYEE'],
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/logging in/i)).not.toBeInTheDocument();
    });
  });

  it('should toggle password visibility', () => {
    customRender(<Login />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    // Initially should be password type
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should navigate to register page', () => {
    customRender(<Login />);

    const registerLink = screen.getByRole('link', { name: /sign up/i });
    fireEvent.click(registerLink);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('should redirect authenticated user to dashboard', () => {
    customRender(<Login />, { initialUser: { username: 'testuser', role: 'EMPLOYEE', token: 'token' } });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle form submission with Enter key', async () => {
    const mockLoginResponse = {
      data: {
        token: 'mock-jwt-token',
        username: 'testuser',
        roles: ['EMPLOYEE'],
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockLoginResponse);

    customRender(<Login />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  it('should remember me functionality', async () => {
    const mockLoginResponse = {
      data: {
        token: 'mock-jwt-token',
        username: 'testuser',
        roles: ['EMPLOYEE'],
        expiresAt: Date.now() + 86400000, // 24 hours
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockLoginResponse);

    customRender(<Login />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberMeCheckbox);
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
        rememberMe: true,
      });
    });
  });
});
