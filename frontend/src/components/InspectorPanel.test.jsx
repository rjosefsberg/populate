import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InspectorPanel from './InspectorPanel';

describe('InspectorPanel', () => {
    it('renders nothing when no entity is set', () => {
        const { container } = render(<InspectorPanel entity={null} onClose={jest.fn()} onEdit={jest.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the entity and calls onEdit, closing the panel via onClose', () => {
        const entity = { id: 1, title: 'Gandalf', body: 'A wise wizard.', entity_type: 'person', associations: [] };
        const onEdit = jest.fn();
        const onClose = jest.fn();
        render(<InspectorPanel entity={entity} onClose={onClose} onEdit={onEdit} />);

        expect(screen.getByText('Gandalf')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));
        expect(onEdit).toHaveBeenCalledWith(entity);

        fireEvent.click(screen.getByRole('button', { name: /close panel/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
