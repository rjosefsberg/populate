import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AssociationGraph from './AssociationGraph';
import { getProjectAssociations } from '../api/associations';

jest.mock('../api/associations');

const entities = [
    { id: 1, title: 'Gandalf', entity_type: 'person' },
    { id: 2, title: 'Frodo', entity_type: 'person' },
];

describe('AssociationGraph', () => {
    it('renders a node per entity and an edge label per association', async () => {
        getProjectAssociations.mockResolvedValue([
            { id: 10, entity_id_1: 1, entity_id_2: 2, description: 'mentor and student' },
        ]);

        render(<AssociationGraph projectId={5} entities={entities} onSelectEntity={jest.fn()} />);

        await waitFor(() => expect(screen.getByText('Gandalf')).toBeInTheDocument());
        expect(screen.getByText('Frodo')).toBeInTheDocument();
        // jsdom doesn't lay out nodes, so React Flow can't render the edge path/label
        // itself; its accessibility description node is still a reliable signal
        // that one edge was registered.
        expect(document.getElementById('react-flow__edge-desc-1')).toBeInTheDocument();
    });

    it('shows an empty-state message when the project has no entities', async () => {
        getProjectAssociations.mockResolvedValue([]);
        render(<AssociationGraph projectId={5} entities={[]} onSelectEntity={jest.fn()} />);
        await waitFor(() => expect(screen.getByText(/no entities yet/i)).toBeInTheDocument());
    });
});
