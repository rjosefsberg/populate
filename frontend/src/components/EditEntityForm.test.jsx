import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditEntityForm from './EditEntityForm';

// Mock the associations API
jest.mock('../api/associations', () => ({
    createAssociation: jest.fn(),
    deleteAssociation: jest.fn(),
}));

import { createAssociation, deleteAssociation } from '../api/associations';

const baseEntity = {
    id: 1,
    title: 'Gandalf',
    body: 'A wise wizard of Middle-earth.',
    associations: [],
};

const entities = [
    { id: 1, title: 'Gandalf', body: 'A wizard.' },
    { id: 2, title: 'Frodo', body: 'A hobbit.' },
];

describe('EditEntityForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with title and body pre-filled', () => {
        render(<EditEntityForm entity={baseEntity} entities={entities} onSave={jest.fn()} onCancel={jest.fn()} />);
        expect(screen.getByDisplayValue('Gandalf')).toBeInTheDocument();
        expect(screen.getByDisplayValue('A wise wizard of Middle-earth.')).toBeInTheDocument();
    });

    it('calls onSave with id, title, body when Save clicked', async () => {
        const onSave = jest.fn();
        render(<EditEntityForm entity={baseEntity} entities={entities} onSave={onSave} onCancel={jest.fn()} />);

        const titleInput = screen.getByDisplayValue('Gandalf');
        await userEvent.clear(titleInput);
        await userEvent.type(titleInput, 'Gandalf the White');

        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(onSave).toHaveBeenCalledWith(1, 'Gandalf the White', 'A wise wizard of Middle-earth.');
    });

    it('calls onCancel when Cancel clicked', () => {
        const onCancel = jest.fn();
        render(<EditEntityForm entity={baseEntity} entities={entities} onSave={jest.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onCancel).toHaveBeenCalled();
    });

    it('calls createAssociation and adds row when + Add clicked', async () => {
        const newAssoc = {
            id: 99,
            entity_id_1: 1,
            entity_id_2: 2,
            entity_1_title: 'Gandalf',
            entity_2_title: 'Frodo',
            description: 'mentor',
        };
        createAssociation.mockResolvedValue(newAssoc);

        render(<EditEntityForm entity={baseEntity} entities={entities} onSave={jest.fn()} onCancel={jest.fn()} />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '2' } });

        fireEvent.change(screen.getByPlaceholderText(/describe the relationship/i), {
            target: { value: 'mentor' }
        });

        fireEvent.click(screen.getByRole('button', { name: /\+ add/i }));

        expect(createAssociation).toHaveBeenCalledWith({
            entity_id_1: 1,
            entity_id_2: 2,
            description: 'mentor',
        });

        await waitFor(() => {
            // Frodo should appear in the associations list
            const listItems = screen.queryAllByRole('listitem');
            const associationItem = listItems.find(item => item.textContent.includes('Frodo'));
            expect(associationItem).toBeTruthy();
        });
    });

    it('calls deleteAssociation and removes row when × clicked', async () => {
        deleteAssociation.mockResolvedValue({});

        const entityWithAssoc = {
            ...baseEntity,
            associations: [
                { id: 10, entity_id_1: 1, entity_id_2: 2, entity_1_title: 'Gandalf', entity_2_title: 'Frodo', description: 'allies' }
            ]
        };

        render(<EditEntityForm entity={entityWithAssoc} entities={entities} onSave={jest.fn()} onCancel={jest.fn()} />);

        // The association list item containing Frodo
        const listItems = screen.getAllByRole('listitem');
        const frodoItem = listItems.find(item => item.textContent.includes('allies'));
        expect(frodoItem).toBeTruthy();

        // Click the × button within that item
        const deleteBtn = within(frodoItem).getByText('×');
        fireEvent.click(deleteBtn);

        expect(deleteAssociation).toHaveBeenCalledWith(10);

        await waitFor(() => {
            const items = screen.queryAllByRole('listitem');
            const stillPresent = items.find(item => item.textContent.includes('allies'));
            expect(stillPresent).toBeFalsy();
        });
    });
});
