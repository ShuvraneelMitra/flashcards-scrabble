import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Not authenticated.' }),
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the auth screen first', () => {
  render(<App />);
  expect(screen.getByText(/account access/i)).toBeInTheDocument();
});
