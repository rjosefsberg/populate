import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('renders the sidebar and create button', async () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
});
