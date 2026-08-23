import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import selectEvent from 'react-select-event';

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

        expect(chatWithAssistant).toHaveBeenCalledWith('person', [
            { role: 'user', content: 'Give me an idea' },
        ], []);
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

    it('does not show a context multiselect when there are no entities and no current entity', () => {
        render(<AssistChatPanel entities={[]} />);
        expect(screen.queryByText(/include entity in context/i)).not.toBeInTheDocument();
    });

    it('lets the user select entities to include as context and sends them', async () => {
        chatWithAssistant.mockResolvedValue({ reply: 'Sure thing.' });
        const entities = [
            { id: 1, title: 'Gandalf', body: 'A wizard.' },
            { id: 2, title: 'Frodo', body: 'A hobbit.' },
        ];

        render(<AssistChatPanel entities={entities} />);
        expect(screen.getByText(/include entity in context/i)).toBeInTheDocument();

        await selectEvent.select(screen.getByLabelText(/include entity in context/i), ['Gandalf']);
        await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), 'Give me an idea');
        fireEvent.click(screen.getByRole('button', { name: /send/i }));

        await waitFor(() => {
            expect(chatWithAssistant).toHaveBeenCalledWith(
                'person',
                [{ role: 'user', content: 'Give me an idea' }],
                [{ title: 'Gandalf', body: 'A wizard.' }],
            );
        });
    });

    it('deselecting an entity removes it from context', async () => {
        chatWithAssistant.mockResolvedValue({ reply: 'Sure thing.' });
        const entities = [{ id: 1, title: 'Gandalf', body: 'A wizard.' }];

        render(<AssistChatPanel entities={entities} />);
        const input = screen.getByLabelText(/include entity in context/i);
        await selectEvent.select(input, ['Gandalf']);
        await selectEvent.clearAll(input);

        await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), 'Give me an idea');
        fireEvent.click(screen.getByRole('button', { name: /send/i }));

        await waitFor(() => {
            expect(chatWithAssistant).toHaveBeenCalledWith(
                'person',
                [{ role: 'user', content: 'Give me an idea' }],
                [],
            );
        });
    });

    it('offers the current in-progress entity as a context option', async () => {
        render(<AssistChatPanel entities={[]} currentEntity={{ title: 'Aragorn', body: 'A ranger.' }} />);
        await selectEvent.openMenu(screen.getByLabelText(/include entity in context/i));
        expect(screen.getByText('Aragorn (this entity)')).toBeInTheDocument();
    });

    it('does not offer the current entity as an option when it has no title yet', () => {
        render(<AssistChatPanel entities={[]} currentEntity={{ title: '', body: '' }} />);
        expect(screen.queryByText(/include entity in context/i)).not.toBeInTheDocument();
    });

    it('sends the current entity title and body when selected as context', async () => {
        chatWithAssistant.mockResolvedValue({ reply: 'Sure thing.' });

        render(<AssistChatPanel entities={[]} currentEntity={{ title: 'Aragorn', body: 'A ranger.' }} />);
        await selectEvent.select(screen.getByLabelText(/include entity in context/i), ['Aragorn (this entity)']);
        await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), 'Give me an idea');
        fireEvent.click(screen.getByRole('button', { name: /send/i }));

        await waitFor(() => {
            expect(chatWithAssistant).toHaveBeenCalledWith(
                'person',
                [{ role: 'user', content: 'Give me an idea' }],
                [{ title: 'Aragorn', body: 'A ranger.' }],
            );
        });
    });
});
