# School Employee Management System - Frontend

A modern, responsive web application for managing employee leave requests built with React, TypeScript, and comprehensive testing.

## 🚀 Features

### 🔐 Authentication & Authorization
- **Multi-role authentication** (Employee, Manager, Admin)
- **JWT-based session management** with automatic timeout
- **Role-based access control** with protected routes
- **Session activity tracking** and warning dialogs

### 👥 Employee Management
- **Complete CRUD operations** for employee records
- **Advanced filtering and search** capabilities
- **Bulk operations** (export, delete, update)
- **Responsive data tables** with sorting and pagination
- **Role-based permissions** (view/edit restrictions)

### 📝 Leave Request Management
- **Intuitive leave request submission** with calendar integration
- **Real-time approval workflow** for managers/admins
- **Multiple leave types** (Annual, Sick, Personal, Maternity/Paternity)
- **Automatic balance calculation** and validation
- **File attachments** for medical certificates
- **Bulk approval/rejection** capabilities

### 📊 Dashboard & Analytics
- **Role-specific dashboards** with relevant metrics
- **Real-time updates** and notifications
- **Interactive charts** and statistics
- **Upcoming deadline reminders**
- **Team overview** for managers

### 📅 Calendar Integration
- **Visual calendar view** for leave requests
- **Date range selection** with conflict detection
- **Team availability overview**
- **Holiday and company event integration**

### 📈 Reporting & Export
- **Multiple export formats** (CSV, Excel, PDF)
- **Customizable reports** with filtering options
- **Data visualization** and analytics
- **Automated report generation**

### ♿ Accessibility & UX
- **WCAG 2.1 AA compliance** with screen reader support
- **Keyboard navigation** throughout the application
- **Responsive design** for mobile, tablet, and desktop
- **Dark/light theme support**
- **Progressive loading** and error boundaries

## 🛠️ Technology Stack

### Core Technologies
- **React 18** - Modern UI framework with hooks and concurrent features
- **TypeScript** - Type-safe development and better DX
- **React Router v6** - Declarative routing with nested routes
- **Axios** - HTTP client with interceptors and error handling

### UI & Styling
- **CSS Modules/Styled Components** - Modular styling approach
- **Responsive Design** - Mobile-first design principles
- **Custom Components** - Reusable UI component library

### State Management
- **React Context** - Global state for authentication and app settings
- **Custom Hooks** - Encapsulated business logic and side effects
- **Local Storage** - Persistent session and user preferences

### Development Tools
- **Vite** - Fast development server and build tool
- **ESLint + Biome** - Code linting and formatting
- **Husky** - Git hooks for quality assurance
- **Bun** - Fast package manager and runtime

## 🧪 Testing Strategy

### Testing Framework
- **Jest** - JavaScript testing framework
- **React Testing Library** - Component testing utilities
- **User Event** - User interaction simulation
- **MSW (Mock Service Worker)** - API mocking

### Test Coverage
- **Unit Tests** - Individual component functionality
- **Integration Tests** - Component interaction and workflows
- **Accessibility Tests** - ARIA compliance and keyboard navigation
- **Responsive Tests** - Mobile and desktop layout validation
- **Performance Tests** - Large dataset handling and optimization

### Key Test Files
```
src/__tests__/
├── components/
│   ├── NavigationBar.test.tsx
│   ├── ProtectedRoute.test.tsx
│   ├── SortableTable.test.tsx
│   └── ConfirmationDialog.test.tsx
├── contexts/
│   └── AuthContext.test.tsx
├── hooks/
│   └── useSessionTimeout.test.tsx
├── pages/
│   ├── Login.test.tsx
│   ├── Register.test.tsx
│   ├── Dashboard.test.tsx
│   ├── Employees.test.tsx
│   ├── LeaveRequests.test.tsx
│   └── LeaveRequestSubmit.test.tsx
├── utils/
│   └── exportData.test.tsx
├── test-utils.tsx
└── setupTests.ts
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** - Runtime environment
- **Bun** - Package manager (recommended)
- **Git** - Version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leave-management-frontend
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_APP_TITLE=Leave Management System
   VITE_SESSION_TIMEOUT=1800000
   VITE_ENVIRONMENT=development
   ```

4. **Start development server**
   ```bash
   bun run dev
   ```

5. **Open application**
   Navigate to `http://localhost:3000`

### Available Scripts

```bash
# Development
bun run dev              # Start development server
bun run dev:host         # Start dev server with network access

# Building
bun run build            # Build for production
bun run preview          # Preview production build

# Testing
bun run test             # Run all tests
bun run test:watch       # Run tests in watch mode
bun run test:coverage    # Run tests with coverage report
bun run test:ci          # Run tests for CI environment

# Code Quality
bun run lint             # Run ESLint
bun run lint:fix         # Fix ESLint issues
bun run format           # Format code with Biome
bun run type-check       # TypeScript type checking

# Utilities
bun run analyze          # Analyze bundle size
bun run clean            # Clean build artifacts
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── NavigationBar.tsx
│   ├── ProtectedRoute.tsx
│   ├── SortableTable.tsx
│   ├── ConfirmationDialog.tsx
│   ├── ErrorBoundary.tsx
│   └── SessionManager.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── hooks/               # Custom React hooks
│   └── useSessionTimeout.tsx
├── pages/               # Page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Employees.tsx
│   ├── LeaveRequests.tsx
│   ├── LeaveRequestSubmit.tsx
│   ├── UserProfile.tsx
│   ├── CalendarView.tsx
│   └── NotFound.tsx
├── api/                 # API integration
│   └── axios.ts
├── utils/               # Utility functions
│   └── exportData.ts
├── types/               # TypeScript type definitions
│   ├── auth.ts
│   ├── employee.ts
│   └── leaveRequest.ts
├── assets/              # Static assets
├── styles/              # Global styles
└── __tests__/           # Test files
```

## 🔐 Authentication Flow

### Login Process
1. User enters credentials
2. Frontend validates input
3. API call to `/auth/login`
4. JWT token stored in localStorage
5. User context updated
6. Redirect to dashboard

### Session Management
- **Automatic token refresh** before expiration
- **Activity-based session extension**
- **Inactivity warnings** with countdown
- **Multi-tab synchronization**
- **Secure logout** with token cleanup

### Role-Based Access
```typescript
// Role hierarchy
ADMIN > MANAGER > EMPLOYEE

// Route protection
<ProtectedRoute requiredRole="ADMIN">
  <AdminOnlyComponent />
</ProtectedRoute>

// Conditional rendering
{isAdmin && <AdminControls />}
{(isAdmin || isManager) && <ManagementTools />}
```

## 📊 State Management

### Authentication Context
```typescript
interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
}
```

### Session Timeout Hook
```typescript
interface SessionTimeoutHook {
  isActive: boolean;
  showWarning: boolean;
  remainingTime: number;
  extendSession: () => void;
  logout: () => void;
}
```

## 🎨 UI Components

### SortableTable
- **Dynamic sorting** by any column
- **Pagination** with configurable page sizes
- **Row selection** (single/multiple)
- **Custom cell rendering**
- **Export functionality**
- **Responsive design** with mobile adaptations

### ConfirmationDialog
- **Flexible content** with custom actions
- **Keyboard navigation** and accessibility
- **Loading states** and error handling
- **Multiple dialog types** (info, warning, danger)
- **Animation support**

### NavigationBar
- **Role-based menu items**
- **Responsive mobile menu**
- **User profile dropdown**
- **Notification indicators**
- **Theme toggle**

## 🧪 Testing Guide

### Running Tests
```bash
# Run all tests
bun run test

# Run specific test file
bun run test Login.test.tsx

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Writing Tests
```typescript
import { customRender, mockAuthUser } from '../test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  const user = userEvent.setup();

  it('should handle user interaction', async () => {
    customRender(<Component />, { initialUser: mockAuthUser });

    const button = screen.getByRole('button', { name: /submit/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### Test Utilities
- **customRender** - Render with providers and context
- **mockAuthUser** - Predefined user objects for testing
- **mockAxios** - API call mocking
- **waitForLoadingToFinish** - Async operation helpers

## 🚀 Deployment

### Production Build
```bash
# Build the application
bun run build

# Preview the build locally
bun run preview
```

### Environment Configuration
```env
# Production environment variables
VITE_API_BASE_URL=https://api.yourcompany.com
VITE_APP_TITLE=Leave Management System
VITE_SESSION_TIMEOUT=1800000
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=your-sentry-dsn
```

### Build Optimization
- **Code splitting** by routes and features
- **Tree shaking** for unused code elimination
- **Asset optimization** with compression
- **Bundle analysis** for size monitoring

## 📈 Performance

### Optimization Strategies
- **React.memo** for expensive components
- **useMemo/useCallback** for expensive calculations
- **Virtual scrolling** for large datasets
- **Lazy loading** for route components
- **Image optimization** with WebP format
- **Service worker** for offline capability

### Performance Monitoring
- **Core Web Vitals** tracking
- **Bundle size monitoring**
- **Render performance profiling**
- **Network request optimization**

## ♿ Accessibility

### WCAG 2.1 AA Compliance
- **Semantic HTML** with proper headings
- **ARIA labels** and descriptions
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** compliance
- **Focus management** in modals/dialogs

### Testing Accessibility
```bash
# Run accessibility tests
bun run test -- --testNamePattern="accessibility"

# Manual testing with keyboard
# Tab through all interactive elements
# Test screen reader announcements
# Verify color contrast ratios
```

## 🔧 Configuration

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Write** tests for new functionality
4. **Implement** the feature
5. **Ensure** all tests pass
6. **Submit** a pull request

### Code Standards
- **TypeScript** for all new code
- **ESLint + Biome** for code formatting
- **Jest + RTL** for testing
- **Conventional commits** for commit messages
- **100% test coverage** for critical paths

### Pull Request Guidelines
- **Clear description** of changes
- **Test coverage** for new features
- **No breaking changes** without discussion
- **Performance impact** consideration
- **Accessibility compliance** verification

## 📚 API Integration

### Authentication Endpoints
```typescript
POST /api/auth/login     // User login
POST /api/auth/register  // User registration
POST /api/auth/logout    // User logout
POST /api/auth/refresh   // Token refresh
```

### Employee Endpoints
```typescript
GET    /api/employees           // Get all employees
POST   /api/employees           // Create employee
GET    /api/employees/:id       // Get employee by ID
PUT    /api/employees/:id       // Update employee
DELETE /api/employees/:id       // Delete employee
GET    /api/employees/team      // Get team members (manager)
```

### Leave Request Endpoints
```typescript
GET    /api/leave-requests      // Get all requests (admin)
POST   /api/leave-requests      // Create request
GET    /api/leave-requests/my   // Get user's requests
PUT    /api/leave-requests/:id/approve  // Approve request
PUT    /api/leave-requests/:id/reject   // Reject request
DELETE /api/leave-requests/:id  // Cancel request
```

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules bun.lockb
bun install

# Clear build cache
bun run clean
```

**Test Failures**
```bash
# Update snapshots
bun run test -- --updateSnapshot

# Clear Jest cache
bun run test -- --clearCache
```

**Development Server Issues**
```bash
# Check port availability
lsof -ti:3000

# Restart with clean cache
bun run dev --force
```

### Performance Issues
- **Enable React DevTools Profiler**
- **Monitor bundle size** with analyzer
- **Check for memory leaks** in components
- **Optimize re-renders** with React.memo

## 🆘 Support

For support and questions:
- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue with detailed description
- **Discussions**: Use GitHub Discussions for general questions
- **Email**: praiseolufemi1@gmail.com

---

**Built with ❤️ by Praise Olufemi**
