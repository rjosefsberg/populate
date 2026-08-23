import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

const entities = [
    { id: 1, title: 'Gandalf' },
    { id: 2, title: 'Frodo' },
    { id: 3, title: 'Aragorn' },
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
