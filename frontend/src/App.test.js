import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock the auth client so getMe returns authenticated=true
jest.mock('./api/client', () => ({
    getMe: jest.fn().mockResolvedValue({ authenticated: true }),
    logout: jest.fn().mockResolvedValue({ ok: true }),
    login: jest.fn(),
    setUnauthorizedHandler: jest.fn(),
    apiFetch: jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
    }),
}));

beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
    });
});

afterEach(() => {
    jest.clearAllMocks();
});

test('renders the sidebar and create button when authenticated', async () => {
    render(<App />);
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });
});
