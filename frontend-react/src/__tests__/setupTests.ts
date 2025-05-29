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
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
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
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock window.location
delete (window as any).location;
window.location = {
  ...window.location,
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  ancestorOrigins: {} as DOMStringList,
};

// Mock navigator
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    readText: jest.fn().mockImplementation(() => Promise.resolve('')),
  },
  writable: true,
});

Object.defineProperty(navigator, 'sendBeacon', {
  value: jest.fn().mockImplementation(() => true),
  writable: true,
});

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: number = 0;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  abort() {}
  readAsArrayBuffer() {}
  readAsBinaryString() {}
  readAsDataURL() {}
  readAsText() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }

  EMPTY = 0;
  LOADING = 1;
  DONE = 2;
};

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Suppress specific React warnings in tests
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is deprecated') ||
    args[0]?.includes?.('Warning: React.createFactory() is deprecated') ||
    args[0]?.includes?.('Warning: componentWillMount has been renamed') ||
    args[0]?.includes?.('Warning: componentWillReceiveProps has been renamed') ||
    args[0]?.includes?.('Warning: componentWillUpdate has been renamed')
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Suppress specific warnings in tests
  if (
    args[0]?.includes?.('Warning: React.createFactory() is deprecated') ||
    args[0]?.includes?.('Warning: Each child in a list should have a unique "key" prop')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Mock HTMLElement methods
HTMLElement.prototype.scrollIntoView = jest.fn();
HTMLElement.prototype.hasPointerCapture = jest.fn();
HTMLElement.prototype.releasePointerCapture = jest.fn();
HTMLElement.prototype.setPointerCapture = jest.fn();

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock crypto for environments that don't have it
if (typeof crypto === 'undefined') {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'mocked-uuid-' + Math.random().toString(36).substr(2, 9),
      getRandomValues: (array: any) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
    },
  });
}

// Mock performance API
if (typeof performance === 'undefined') {
  Object.defineProperty(global, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
    },
  });
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn(cb => setTimeout(cb, 0));
global.cancelIdleCallback = jest.fn(id => clearTimeout(id));

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
};

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(() => ''),
  setProperty: jest.fn(),
  removeProperty: jest.fn(),
  cssText: '',
  length: 0,
  parentRule: null,
  getPropertyPriority: jest.fn(() => ''),
  item: jest.fn(() => ''),
  [Symbol.iterator]: jest.fn(),
}));

// Mock window.open
window.open = jest.fn();

// Mock window.print
window.print = jest.fn();

// Mock window.focus
window.focus = jest.fn();

// Mock alert, confirm, prompt
window.alert = jest.fn();
window.confirm = jest.fn(() => true);
window.prompt = jest.fn(() => '');

// Mock Blob
if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts?: BlobPart[], options?: BlobPropertyBag) {}
    size = 0;
    type = '';
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
    slice() { return new Blob(); }
    stream() { return new ReadableStream(); }
    text() { return Promise.resolve(''); }
  };
}

// Setup global test timeout
jest.setTimeout(10000);

// Global test utilities
global.waitForNextTick = () => new Promise(resolve => process.nextTick(resolve));
global.waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Clear localStorage and sessionStorage
  localStorageMock.clear();

  // Reset fetch mock
  if (global.fetch) {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  }

  // Reset DOM
  document.body.innerHTML = '';

  // Reset window location
  window.location.href = 'http://localhost:3000';
  window.location.pathname = '/';
  window.location.search = '';
  window.location.hash = '';

  // Clean up any timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attribute: string, value?: string): R;
      toHaveFocus(): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toHaveValue(value: string | number): R;
      toHaveDisplayValue(value: string | RegExp): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeEmptyDOMElement(): R;
    }
  }

  // Global test utilities
  var waitForNextTick: () => Promise<void>;
  var waitFor: (ms: number) => Promise<void>;
}

export {};
