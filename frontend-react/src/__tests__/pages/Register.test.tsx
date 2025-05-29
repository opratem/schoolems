import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, mockAxios } from '../test-utils';
import Register from '../../pages/Register';

// Mock axios
jest.mock('../../api/axios', () => mockAxios);

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

describe('Register Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.post.mockClear();
    mockNavigate.mockClear();
  });

  it('should render registration form', () => {
    customRender(<Register />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    customRender(<Register />);

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    customRender(<Register />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should validate password requirements', async () => {
    customRender(<Register />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, '123'); // Too short

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate password confirmation match', async () => {
    customRender(<Register />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should handle successful registration', async () => {
    const mockRegisterResponse = {
      data: {
        message: 'Registration successful',
        user: {
          username: 'newuser',
          email: 'newuser@example.com',
        },
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockRegisterResponse);

    customRender(<Register />);

    // Fill in valid form data
    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/register', {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { message: 'Registration successful! Please log in.' },
      });
    });
  });

  it('should handle registration failure with error message', async () => {
    const errorMessage = 'Username already exists';
    mockAxios.post.mockRejectedValueOnce({
      response: {
        data: { message: errorMessage },
        status: 409,
      },
    });

    customRender(<Register />);

    // Fill in form data
    await user.type(screen.getByLabelText(/username/i), 'existinguser');
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should show loading state during registration', async () => {
    let resolveRegister: (value: any) => void;
    const registerPromise = new Promise(resolve => {
      resolveRegister = resolve;
    });

    mockAxios.post.mockReturnValueOnce(registerPromise);

    customRender(<Register />);

    // Fill in form data
    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    // Should show loading state
    expect(screen.getByText(/registering/i)).toBeInTheDocument();
    expect(registerButton).toBeDisabled();

    // Resolve the promise
    resolveRegister!({
      data: { message: 'Success' },
    });

    await waitFor(() => {
      expect(screen.queryByText(/registering/i)).not.toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    customRender(<Register />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    // Initially should be password type
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide password again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should navigate to login page', async () => {
    customRender(<Register />);

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    await user.click(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should redirect authenticated user to dashboard', () => {
    customRender(<Register />, {
      initialUser: { username: 'testuser', role: 'EMPLOYEE', token: 'token' }
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should validate username length', async () => {
    customRender(<Register />);

    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'ab'); // Too short

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate special characters in username', async () => {
    customRender(<Register />);

    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'user@name!'); // Invalid characters

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/username can only contain letters, numbers, and underscores/i)).toBeInTheDocument();
    });
  });

  it('should handle terms and conditions checkbox', async () => {
    customRender(<Register />);

    const termsCheckbox = screen.getByLabelText(/agree to terms and conditions/i);
    expect(termsCheckbox).not.toBeChecked();

    // Try to register without accepting terms
    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/you must agree to the terms and conditions/i)).toBeInTheDocument();
    });

    // Accept terms
    await user.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();
  });

  it('should handle form submission with Enter key', async () => {
    const mockRegisterResponse = {
      data: { message: 'Registration successful' },
    };

    mockAxios.post.mockResolvedValueOnce(mockRegisterResponse);

    customRender(<Register />);

    // Fill in form data
    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.type(screen.getByLabelText(/first name/i), 'John');

    const lastNameInput = screen.getByLabelText(/last name/i);
    await user.type(lastNameInput, 'Doe');

    // Press Enter in last field
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      customRender(<Register />);

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Registration form');

      // Check that all inputs have proper labels
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should announce validation errors to screen readers', async () => {
      customRender(<Register />);

      const registerButton = screen.getByRole('button', { name: /register/i });
      await user.click(registerButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt form layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      customRender(<Register />);

      const form = screen.getByRole('form');
      expect(form).toHaveClass('mobile-layout');
    });
  });
});
