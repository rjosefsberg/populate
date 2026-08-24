import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditEntityForm from './EditEntityForm';

// Mock the associations API
jest.mock('../api/associations', () => ({
    createAssociation: jest.fn(),
    deleteAssociation: jest.fn(),
}));

// The rich-text editor is exercised in its own test suite; stub it here as a plain textarea.
jest.mock('./RichTextEditor', () => ({ value, onChange }) => (
    <textarea aria-label="body" value={value} onChange={e => onChange(e.target.value)} />
));

// The Get-help panel is exercised in its own test suite; stub it here to inspect the props it's given.
jest.mock('./AssistChatPanel', () => ({ entities, currentEntity, entityType }) => (
    <div data-testid="assist-chat-panel">
        <div data-testid="assist-entities">{entities.map(e => e.title).join(',')}</div>
        <div data-testid="assist-current-entity">{currentEntity.title}|{currentEntity.body}</div>
        <div data-testid="assist-entity-type">{entityType}</div>
    </div>
));

import { createAssociation, deleteAssociation } from '../api/associations';

const baseEntity = {
    id: 1,
    title: 'Gandalf',
    body: 'A wise wizard of Middle-earth.',
    entity_type: 'person',
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

    it('calls onSave with id, title, entity type, and body when Save clicked', async () => {
        const onSave = jest.fn();
        render(<EditEntityForm entity={baseEntity} entities={entities} onSave={onSave} onCancel={jest.fn()} />);

        const titleInput = screen.getByDisplayValue('Gandalf');
        await userEvent.clear(titleInput);
        await userEvent.type(titleInput, 'Gandalf the White');

        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(onSave).toHaveBeenCalledWith(1, 'Gandalf the White', 'person', 'A wise wizard of Middle-earth.');
    });

    it('defaults the type select to the entity\'s current type and lets it change', () => {
        const onSave = jest.fn();
        render(<EditEntityForm entity={{ ...baseEntity, entity_type: 'note' }} entities={entities} onSave={onSave} onCancel={jest.fn()} />);

        const typeSelect = screen.getByLabelText('Type');
        expect(typeSelect.value).toBe('note');

        fireEvent.change(typeSelect, { target: { value: 'place' } });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(onSave).toHaveBeenCalledWith(1, 'Gandalf', 'place', 'A wise wizard of Middle-earth.');
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

        const select = screen.getByLabelText('Link to entity');
        fireEvent.change(select, { target: { value: '2' } });

        fireEvent.change(screen.getByPlaceholderText(/describe the relationship/i), {
            target: { value: 'mentor' }
        });

        fireEvent.click(screen.getByRole('button', { name: '+ Add' }));

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

    it('calls deleteAssociation and removes row when remove button clicked', async () => {
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

        // Click the remove button within that item
        const deleteBtn = within(frodoItem).getByRole('button', { name: /remove association/i });
        fireEvent.click(deleteBtn);

        expect(deleteAssociation).toHaveBeenCalledWith(10);

        await waitFor(() => {
            const items = screen.queryAllByRole('listitem');
            const stillPresent = items.find(item => item.textContent.includes('allies'));
            expect(stillPresent).toBeFalsy();
        });
    });

    it('does not show the Get-help panel until toggled', () => {
        render(<EditEntityForm entity={baseEntity} entities={entities} onSave={jest.fn()} onCancel={jest.fn()} />);
        expect(screen.queryByTestId('assist-chat-panel')).not.toBeInTheDocument();
    });

    it('toggles the Get-help panel and passes it the other entities and the live draft', async () => {
        render(<EditEntityForm entity={baseEntity} entities={entities} onSave={jest.fn()} onCancel={jest.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /get help/i }));
        expect(screen.getByTestId('assist-chat-panel')).toBeInTheDocument();
        expect(screen.getByTestId('assist-entities')).toHaveTextContent('Frodo');
        expect(screen.getByTestId('assist-entities')).not.toHaveTextContent('Gandalf');
        expect(screen.getByTestId('assist-current-entity')).toHaveTextContent('Gandalf|A wise wizard of Middle-earth.');
        expect(screen.getByTestId('assist-entity-type')).toHaveTextContent('person');

        fireEvent.click(screen.getByRole('button', { name: /hide help/i }));
        expect(screen.queryByTestId('assist-chat-panel')).not.toBeInTheDocument();
    });

    it('passes the edited title and body to the Get-help panel as the current entity updates', async () => {
        render(<EditEntityForm entity={baseEntity} entities={entities} onSave={jest.fn()} onCancel={jest.fn()} />);

        const titleInput = screen.getByDisplayValue('Gandalf');
        await userEvent.clear(titleInput);
        await userEvent.type(titleInput, 'Gandalf the White');

        fireEvent.click(screen.getByRole('button', { name: /get help/i }));
        expect(screen.getByTestId('assist-current-entity')).toHaveTextContent('Gandalf the White|A wise wizard of Middle-earth.');
    });
});
