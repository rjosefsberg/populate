import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the auth client so getMe returns authenticated=true
jest.mock('./api/client', () => ({
    getMe: jest.fn().mockResolvedValue({ authenticated: true }),
    logout: jest.fn().mockResolvedValue({ ok: true }),
    login: jest.fn(),
    setUnauthorizedHandler: jest.fn(),
    apiFetch: jest.fn((url) => {
        if (typeof url === 'string' && url.startsWith('/api/projects')) {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: async () => [{ id: 1, name: 'Fellowship', created_at: '2026-01-01T00:00:00' }],
            });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
    }),
}));

afterEach(() => {
    jest.clearAllMocks();
});

test('shows the project list and prompts for a selection before a project is opened', async () => {
    render(<App />);
    await waitFor(() => {
        expect(screen.getByText('Fellowship')).toBeInTheDocument();
    });
    expect(screen.getByText(/select a project/i)).toBeInTheDocument();
});

test('renders the entity sidebar and create button after opening a project', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Fellowship'));
    await userEvent.click(screen.getByText('Fellowship'));
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });
});
