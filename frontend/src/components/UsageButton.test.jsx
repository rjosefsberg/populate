import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsageButton from './UsageButton';

beforeEach(() => {
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.resetAllMocks();
});

const usageData = {
    key_active: true,
    credits_remaining: null,
    input_tokens: 1000,
    output_tokens: 500,
    total_tokens: 1500,
    request_count: 3,
};

describe('UsageButton', () => {
    it('renders the API Usage button', () => {
        render(<UsageButton />);
        expect(screen.getByRole('button', { name: /api usage/i })).toBeInTheDocument();
    });

    it('shows loading state while fetching', async () => {
        let resolve;
        global.fetch.mockReturnValue(new Promise(r => { resolve = r; }));

        render(<UsageButton />);
        fireEvent.click(screen.getByRole('button', { name: /api usage/i }));

        expect(screen.getByText(/checking/i)).toBeInTheDocument();
        resolve({ ok: true, json: () => Promise.resolve(usageData) });
    });

    it('shows populated data after successful fetch', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(usageData),
        });

        render(<UsageButton />);
        fireEvent.click(screen.getByRole('button', { name: /api usage/i }));

        await waitFor(() => {
            expect(screen.getByText(/key active/i)).toBeInTheDocument();
        });
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows Failed to load when fetch rejects', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));

        render(<UsageButton />);
        fireEvent.click(screen.getByRole('button', { name: /api usage/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
        });
    });

    it('shows Failed to load when response is not ok', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
        });

        render(<UsageButton />);
        fireEvent.click(screen.getByRole('button', { name: /api usage/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
        });
    });

    it('closes popover when button clicked again', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(usageData),
        });

        render(<UsageButton />);
        const btn = screen.getByRole('button', { name: /api usage/i });
        fireEvent.click(btn);

        await waitFor(() => expect(screen.getByText(/key active/i)).toBeInTheDocument());

        fireEvent.click(btn);
        expect(screen.queryByText(/key active/i)).not.toBeInTheDocument();
    });
});
