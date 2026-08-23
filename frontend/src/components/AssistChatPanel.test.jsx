import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../api/assist', () => ({
    chatWithAssistant: jest.fn(),
}));

import { chatWithAssistant } from '../api/assist';
import AssistChatPanel from './AssistChatPanel';

describe('AssistChatPanel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sends a message and displays the assistant reply', async () => {
        chatWithAssistant.mockResolvedValue({ reply: 'Try a mysterious hermit.' });

        render(<AssistChatPanel />);
        await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), 'Give me an idea');
        fireEvent.click(screen.getByRole('button', { name: /send/i }));

        expect(screen.getByText('Give me an idea')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Try a mysterious hermit.')).toBeInTheDocument();
        });

        expect(chatWithAssistant).toHaveBeenCalledWith('person', 'fantasy', [
            { role: 'user', content: 'Give me an idea' },
        ]);
    });

    it('does not send an empty message', () => {
        render(<AssistChatPanel />);
        fireEvent.click(screen.getByRole('button', { name: /send/i }));
        expect(chatWithAssistant).not.toHaveBeenCalled();
    });

    it('shows an error message when the request fails', async () => {
        chatWithAssistant.mockRejectedValue(new Error('network error'));

        render(<AssistChatPanel />);
        await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), 'Help');
        fireEvent.click(screen.getByRole('button', { name: /send/i }));

        await waitFor(() => {
            expect(screen.getByText(/went wrong/i)).toBeInTheDocument();
        });
    });
});
