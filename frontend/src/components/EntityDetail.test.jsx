import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EntityDetail from './EntityDetail';

describe('EntityDetail', () => {
    it('renders placeholder when no entity provided', () => {
        render(<EntityDetail entity={null} onEdit={jest.fn()} onDelete={jest.fn()} />);
        expect(screen.getByText(/select an entity/i)).toBeInTheDocument();
    });

    it('renders entity title and body', () => {
        const entity = { id: 1, title: 'Gandalf', body: 'A wise wizard.', associations: [] };
        render(<EntityDetail entity={entity} onEdit={jest.fn()} onDelete={jest.fn()} />);
        expect(screen.getByText('Gandalf')).toBeInTheDocument();
        expect(screen.getByText('A wise wizard.')).toBeInTheDocument();
    });

    it('renders associations when present', () => {
        const entity = {
            id: 1,
            title: 'Gandalf',
            body: 'A wise wizard.',
            associations: [
                { id: 10, entity_id_1: 1, entity_id_2: 2, entity_1_title: 'Gandalf', entity_2_title: 'Frodo', description: 'mentor' }
            ]
        };
        render(<EntityDetail entity={entity} onEdit={jest.fn()} onDelete={jest.fn()} />);
        expect(screen.getByText('Frodo')).toBeInTheDocument();
        expect(screen.getByText('mentor')).toBeInTheDocument();
    });

    it('calls onEdit with entity when Edit clicked', () => {
        const entity = { id: 1, title: 'Gandalf', body: 'A wise wizard.', associations: [] };
        const onEdit = jest.fn();
        render(<EntityDetail entity={entity} onEdit={onEdit} onDelete={jest.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));
        expect(onEdit).toHaveBeenCalledWith(entity);
    });

    it('calls onDelete with entity id when Delete clicked', () => {
        const entity = { id: 42, title: 'Gandalf', body: 'A wise wizard.', associations: [] };
        const onDelete = jest.fn();
        render(<EntityDetail entity={entity} onEdit={jest.fn()} onDelete={onDelete} />);
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        expect(onDelete).toHaveBeenCalledWith(42);
    });

    it('shows entity_1_title as linked when entity is entity_2', () => {
        const entity = {
            id: 2,
            title: 'Frodo',
            body: 'A hobbit.',
            associations: [
                { id: 10, entity_id_1: 1, entity_id_2: 2, entity_1_title: 'Gandalf', entity_2_title: 'Frodo', description: 'guides' }
            ]
        };
        render(<EntityDetail entity={entity} onEdit={jest.fn()} onDelete={jest.fn()} />);
        expect(screen.getByText('Gandalf')).toBeInTheDocument();
    });
});
