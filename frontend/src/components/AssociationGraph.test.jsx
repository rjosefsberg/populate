import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssociationGraph from './AssociationGraph';

const gandalf = {
    id: 1,
    title: 'Gandalf',
    entity_type: 'person',
    associations: [
        { id: 10, entity_id_1: 1, entity_id_2: 2, entity_1_title: 'Gandalf', entity_2_title: 'Frodo', description: 'mentor and student' },
    ],
};
const frodo = {
    id: 2,
    title: 'Frodo',
    entity_type: 'person',
    associations: [
        { id: 10, entity_id_1: 1, entity_id_2: 2, entity_1_title: 'Gandalf', entity_2_title: 'Frodo', description: 'mentor and student' },
        { id: 11, entity_id_1: 2, entity_id_2: 3, entity_1_title: 'Frodo', entity_2_title: 'Sam', description: 'friends' },
    ],
};
const sam = { id: 3, title: 'Sam', entity_type: 'person', associations: [] };

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
        render(<AssociationGraph entity={sam} entities={[gandalf, frodo, sam]} onFocusEntity={jest.fn()} />);
        expect(screen.getByText(/no associations yet/i)).toBeInTheDocument();
    });

    it('renders the type legend', () => {
        render(<AssociationGraph entity={gandalf} entities={[gandalf, frodo]} onFocusEntity={jest.fn()} />);
        expect(screen.getByText('Person')).toBeInTheDocument();
        expect(screen.getByText('Place')).toBeInTheDocument();
        expect(screen.getByText('Thing')).toBeInTheDocument();
        expect(screen.getByText('Note')).toBeInTheDocument();
    });

    it('clicking a node\'s eye icon inspects that entity without recentering the graph', async () => {
        const onFocusEntity = jest.fn();
        const onInspectEntity = jest.fn();
        render(
            <AssociationGraph
                entity={gandalf}
                entities={[gandalf, frodo]}
                onFocusEntity={onFocusEntity}
                onInspectEntity={onInspectEntity}
            />
        );

        // jsdom never resolves React Flow's initial measurement pass, so nodes
        // stay `visibility: hidden`, which getByRole excludes from the
        // accessibility tree; getByTitle isn't visibility-filtered.
        await userEvent.click(screen.getByTitle('View Frodo'));

        expect(onInspectEntity).toHaveBeenCalledWith(frodo);
        expect(onFocusEntity).not.toHaveBeenCalled();
    });

    it('double-clicking a neighbor node recenters the graph on it', () => {
        const onFocusEntity = jest.fn();
        render(<AssociationGraph entity={gandalf} entities={[gandalf, frodo]} onFocusEntity={onFocusEntity} />);

        fireEvent.doubleClick(screen.getByText('Frodo'));

        expect(onFocusEntity).toHaveBeenCalledWith(frodo);
    });

    it('double-clicking the center node does not recenter', () => {
        const onFocusEntity = jest.fn();
        render(<AssociationGraph entity={gandalf} entities={[gandalf, frodo]} onFocusEntity={onFocusEntity} />);

        fireEvent.doubleClick(screen.getByText('Gandalf'));

        expect(onFocusEntity).not.toHaveBeenCalled();
    });

    it('only shows direct associations until "show associations of associations" is checked', async () => {
        render(<AssociationGraph entity={gandalf} entities={[gandalf, frodo, sam]} onFocusEntity={jest.fn()} />);

        expect(screen.queryByText('Sam')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('checkbox', { name: /show associations of associations/i }));

        expect(screen.getByText('Sam')).toBeInTheDocument();
    });
});
