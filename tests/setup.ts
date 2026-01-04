import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window pour les tests Node.js
if (typeof window === 'undefined') {
  global.window = undefined as any;
}

// Mock fetch global
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
