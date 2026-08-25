import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

const entities = [
    { id: 1, title: 'Gandalf', entity_type: 'person', created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 2, title: 'Frodo', entity_type: 'person', created_at: '2026-01-02', updated_at: '2026-01-02' },
    { id: 3, title: 'Aragorn', entity_type: 'place', created_at: '2026-01-03', updated_at: '2026-01-03' },
];

const entityModeProps = {
    mode: 'entities',
    projects: [],
    onOpenProject: jest.fn(),
    onCreateProject: jest.fn(),
    onRenameProject: jest.fn(),
    onDeleteProject: jest.fn(),
    projectName: 'Middle-earth',
    onBackToProjects: jest.fn(),
};

describe('Sidebar — entity mode', () => {
    it('renders all entity titles', () => {
        render(<Sidebar {...entityModeProps} entities={entities} selectedId={null} onSelect={jest.fn()} />);
        expect(screen.getByText('Gandalf')).toBeInTheDocument();
        expect(screen.getByText('Frodo')).toBeInTheDocument();
        expect(screen.getByText('Aragorn')).toBeInTheDocument();
    });

    it('applies highlight class to selected entity', () => {
        render(<Sidebar {...entityModeProps} entities={entities} selectedId={2} onSelect={jest.fn()} />);
        const frodoItem = screen.getByText('Frodo').closest('li');
        expect(frodoItem.className).toContain('bg-secondary');
    });

    it('does not apply highlight class to unselected entities', () => {
        render(<Sidebar {...entityModeProps} entities={entities} selectedId={2} onSelect={jest.fn()} />);
        const gandalfItem = screen.getByText('Gandalf').closest('li');
        expect(gandalfItem.className).not.toContain('bg-secondary');
    });

    it('calls onSelect with entity when clicked', () => {
        const onSelect = jest.fn();
        render(<Sidebar {...entityModeProps} entities={entities} selectedId={null} onSelect={onSelect} />);
        fireEvent.click(screen.getByText('Aragorn'));
        expect(onSelect).toHaveBeenCalledWith(entities[2]);
    });

    it('renders children', () => {
        render(
            <Sidebar {...entityModeProps} entities={[]} selectedId={null} onSelect={jest.fn()}>
                <div>Child content</div>
            </Sidebar>
        );
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders empty list when no entities', () => {
        render(<Sidebar {...entityModeProps} entities={[]} selectedId={null} onSelect={jest.fn()} />);
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it('renders the project name and a back-to-projects control', () => {
        render(<Sidebar {...entityModeProps} entities={[]} selectedId={null} onSelect={jest.fn()} />);
        expect(screen.getByText('Middle-earth')).toBeInTheDocument();
        expect(screen.getByText(/projects/i)).toBeInTheDocument();
    });

    it('groups entities by type alphabetically when switched to grouped view', () => {
        render(<Sidebar {...entityModeProps} entities={entities} selectedId={null} onSelect={jest.fn()} />);
        fireEvent.click(screen.getByText('Grouped'));
        const headings = screen.getAllByText(/^(Person|Place)$/).map(el => el.textContent);
        expect(headings).toEqual(['Person', 'Place']);
    });

    it('collapses and re-expands a group when its header is clicked', () => {
        render(<Sidebar {...entityModeProps} entities={entities} selectedId={null} onSelect={jest.fn()} />);
        fireEvent.click(screen.getByText('Grouped'));
        expect(screen.getByText('Aragorn')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Place'));
        expect(screen.queryByText('Aragorn')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Place'));
        expect(screen.getByText('Aragorn')).toBeInTheDocument();
    });

    it('sorts entities alphabetically when that sort option is selected', () => {
        render(<Sidebar {...entityModeProps} entities={entities} selectedId={null} onSelect={jest.fn()} />);
        fireEvent.change(screen.getByLabelText('Sort entities'), { target: { value: 'alphabetical' } });
        const items = screen.getAllByRole('listitem').map(li => li.textContent);
        expect(items).toEqual(['Aragorn', 'Frodo', 'Gandalf']);
    });
});

describe('Sidebar — project mode', () => {
    const projects = [
        { id: 1, name: 'Fellowship' },
        { id: 2, name: 'Silmarillion' },
    ];

    it('renders project names instead of entities', () => {
        render(
            <Sidebar
                mode="projects"
                projects={projects}
                onOpenProject={jest.fn()}
                onCreateProject={jest.fn()}
                onRenameProject={jest.fn()}
                onDeleteProject={jest.fn()}
                entities={entities}
                selectedId={null}
                onSelect={jest.fn()}
            />
        );
        expect(screen.getByText('Fellowship')).toBeInTheDocument();
        expect(screen.getByText('Silmarillion')).toBeInTheDocument();
        expect(screen.queryByText('Gandalf')).not.toBeInTheDocument();
    });

    it('calls onOpenProject when a project is clicked', () => {
        const onOpenProject = jest.fn();
        render(
            <Sidebar
                mode="projects"
                projects={projects}
                onOpenProject={onOpenProject}
                onCreateProject={jest.fn()}
                onRenameProject={jest.fn()}
                onDeleteProject={jest.fn()}
                entities={[]}
                selectedId={null}
                onSelect={jest.fn()}
            />
        );
        fireEvent.click(screen.getByText('Fellowship'));
        expect(onOpenProject).toHaveBeenCalledWith(1);
    });
});

describe('Sidebar — hideEntityList', () => {
    it('hides the sort/grouping controls and entity list when hideEntityList is set', () => {
        render(<Sidebar {...entityModeProps} entities={entities} selectedId={null} onSelect={jest.fn()} hideEntityList />);
        expect(screen.queryByLabelText(/sort entities/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('group', { name: /sidebar view mode/i })).not.toBeInTheDocument();
        expect(screen.queryByText('Gandalf')).not.toBeInTheDocument();
    });
});
