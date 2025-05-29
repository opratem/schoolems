# Frontend Testing Setup Guide

## Required Dependencies

Add these to your `package.json` dev dependencies:

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "@types/jest": "^29.5.5",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@babel/preset-env": "^7.22.0",
    "@babel/preset-react": "^7.22.0",
    "@babel/preset-typescript": "^7.22.0",
    "ts-jest": "^29.1.1"
  }
}
```

## Jest Configuration

Create `jest.config.js` in your project root:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

## Setup Test File

Create `src/__tests__/setupTests.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('Warning: ReactDOM.render is deprecated')) {
    return;
  }
  originalConsoleWarn(...args);
};
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Babel Configuration

Create `.babelrc` in project root:

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }],
    "@babel/preset-typescript"
  ]
}
```

## TypeScript Configuration for Tests

Update your `tsconfig.json` to include test files:

```json
{
  "compilerOptions": {
    // ... your existing options
    "types": ["jest", "@testing-library/jest-dom"]
  },
  "include": [
    "src",
    "src/**/__tests__/**/*"
  ]
}
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun test Login.test.tsx

# Run tests matching pattern
bun test -- --testNamePattern="should handle login"
```

## Test File Organization

```
src/
├── __tests__/
│   ├── components/
│   │   ├── NavigationBar.test.tsx
│   │   ├── ProtectedRoute.test.tsx
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.test.tsx
│   ├── pages/
│   │   ├── Login.test.tsx
│   │   ├── Dashboard.test.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── useSessionTimeout.test.tsx
│   ├── utils/
│   │   └── exportData.test.tsx
│   ├── test-utils.tsx
│   ├── setupTests.ts
│   └── setup.md
```

## Coverage Goals

- **Unit Tests**: All components, hooks, utilities
- **Integration Tests**: User flows, API interactions
- **Coverage Target**: 70%+ across branches, functions, lines, statements

## Best Practices

1. **Test user behavior, not implementation details**
2. **Use semantic queries** (`getByRole`, `getByLabelText`)
3. **Test accessibility** (ARIA labels, keyboard navigation)
4. **Mock external dependencies** (APIs, localStorage)
5. **Test error states** (network failures, validation errors)
6. **Test loading states** and async operations
7. **Test responsive behavior** and mobile interactions

## Debugging Tests

```bash
# Run tests with debug output
bun test -- --verbose

# Run single test file with debugging
node --inspect-brk node_modules/.bin/jest --runInBand Login.test.tsx
```
