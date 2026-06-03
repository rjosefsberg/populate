import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

const entities = [
    { id: 1, title: 'Gandalf' },
    { id: 2, title: 'Frodo' },
    { id: 3, title: 'Aragorn' },
];

describe('Sidebar', () => {
    it('renders all entity titles', () => {
        render(<Sidebar entities={entities} selectedId={null} onSelect={jest.fn()} />);
        expect(screen.getByText('Gandalf')).toBeInTheDocument();
        expect(screen.getByText('Frodo')).toBeInTheDocument();
        expect(screen.getByText('Aragorn')).toBeInTheDocument();
    });

    it('applies highlight class to selected entity', () => {
        render(<Sidebar entities={entities} selectedId={2} onSelect={jest.fn()} />);
        const frodoItem = screen.getByText('Frodo').closest('li');
        expect(frodoItem.className).toContain('bg-secondary');
    });

    it('does not apply highlight class to unselected entities', () => {
        render(<Sidebar entities={entities} selectedId={2} onSelect={jest.fn()} />);
        const gandalfItem = screen.getByText('Gandalf').closest('li');
        expect(gandalfItem.className).not.toContain('bg-secondary');
    });

    it('calls onSelect with entity when clicked', () => {
        const onSelect = jest.fn();
        render(<Sidebar entities={entities} selectedId={null} onSelect={onSelect} />);
        fireEvent.click(screen.getByText('Aragorn'));
        expect(onSelect).toHaveBeenCalledWith(entities[2]);
    });

    it('renders children', () => {
        render(
            <Sidebar entities={[]} selectedId={null} onSelect={jest.fn()}>
                <div>Child content</div>
            </Sidebar>
        );
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders empty list when no entities', () => {
        render(<Sidebar entities={[]} selectedId={null} onSelect={jest.fn()} />);
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
});
