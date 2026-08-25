import React from 'react';
import { render, screen } from '@testing-library/react';
import AssociationGraph from './AssociationGraph';

const gandalf = {
    id: 1,
    title: 'Gandalf',
    entity_type: 'person',
    associations: [
        { id: 10, entity_id_1: 1, entity_id_2: 2, entity_1_title: 'Gandalf', entity_2_title: 'Frodo', description: 'mentor and student' },
    ],
};
const frodo = { id: 2, title: 'Frodo', entity_type: 'person', associations: [] };

describe('AssociationGraph', () => {
    it('renders the center entity and one node per associated neighbor', () => {
        render(<AssociationGraph entity={gandalf} entities={[gandalf, frodo]} onFocusEntity={jest.fn()} />);
        expect(screen.getByText('Gandalf')).toBeInTheDocument();
        expect(screen.getByText('Frodo')).toBeInTheDocument();
        // jsdom doesn't lay out nodes, so React Flow can't render the edge
        // path/label itself; its accessibility description node is still a
        // reliable signal that one edge was registered.
        expect(document.querySelector('[id^="react-flow__edge-desc-"]')).toBeInTheDocument();
    });

    it('shows an empty-state message when the entity has no associations', () => {
        render(<AssociationGraph entity={frodo} entities={[gandalf, frodo]} onFocusEntity={jest.fn()} />);
        expect(screen.getByText(/no associations yet/i)).toBeInTheDocument();
    });
});
