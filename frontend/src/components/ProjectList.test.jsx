import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectList from './ProjectList';

const projects = [
    { id: 1, name: 'Fellowship' },
    { id: 2, name: 'Silmarillion' },
];

describe('ProjectList', () => {
    it('renders all project names', () => {
        render(<ProjectList projects={projects} onOpen={jest.fn()} onCreate={jest.fn()} onRename={jest.fn()} onDelete={jest.fn()} />);
        expect(screen.getByText('Fellowship')).toBeInTheDocument();
        expect(screen.getByText('Silmarillion')).toBeInTheDocument();
    });

    it('calls onOpen when a project row is clicked', () => {
        const onOpen = jest.fn();
        render(<ProjectList projects={projects} onOpen={onOpen} onCreate={jest.fn()} onRename={jest.fn()} onDelete={jest.fn()} />);
        fireEvent.click(screen.getByText('Fellowship'));
        expect(onOpen).toHaveBeenCalledWith(1);
    });

    it('calls onCreate with the typed name on Enter', async () => {
        const onCreate = jest.fn();
        render(<ProjectList projects={[]} onOpen={jest.fn()} onCreate={onCreate} onRename={jest.fn()} onDelete={jest.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /new project/i }));
        const input = screen.getByPlaceholderText(/project name/i);
        await userEvent.type(input, 'Gondor{enter}');
        expect(onCreate).toHaveBeenCalledWith('Gondor');
    });

    it('opens the item menu with Open, Rename, and Delete, with Delete styled red', async () => {
        render(<ProjectList projects={projects} onOpen={jest.fn()} onCreate={jest.fn()} onRename={jest.fn()} onDelete={jest.fn()} />);
        const toggles = screen.getAllByRole('button', { name: /project options/i });
        await userEvent.click(toggles[0]);
        expect(screen.getByText('Open')).toBeInTheDocument();
        expect(screen.getByText('Rename')).toBeInTheDocument();
        const deleteItem = screen.getByText('Delete');
        expect(deleteItem).toBeInTheDocument();
        expect(deleteItem.className).toContain('text-danger');
    });

    it('confirms before calling onDelete, and skips the call when the user cancels', async () => {
        const onDelete = jest.fn();
        window.confirm = jest.fn().mockReturnValue(false);
        render(<ProjectList projects={projects} onOpen={jest.fn()} onCreate={jest.fn()} onRename={jest.fn()} onDelete={onDelete} />);
        await userEvent.click(screen.getAllByRole('button', { name: /project options/i })[0]);
        await userEvent.click(screen.getByText('Delete'));
        expect(window.confirm).toHaveBeenCalled();
        expect(onDelete).not.toHaveBeenCalled();
    });

    it('calls onDelete when the user confirms', async () => {
        const onDelete = jest.fn();
        window.confirm = jest.fn().mockReturnValue(true);
        render(<ProjectList projects={projects} onOpen={jest.fn()} onCreate={jest.fn()} onRename={jest.fn()} onDelete={onDelete} />);
        await userEvent.click(screen.getAllByRole('button', { name: /project options/i })[0]);
        await userEvent.click(screen.getByText('Delete'));
        expect(onDelete).toHaveBeenCalledWith(1);
    });

    it('calls onRename with the edited name on Enter', async () => {
        const onRename = jest.fn();
        render(<ProjectList projects={projects} onOpen={jest.fn()} onCreate={jest.fn()} onRename={onRename} onDelete={jest.fn()} />);
        await userEvent.click(screen.getAllByRole('button', { name: /project options/i })[0]);
        await userEvent.click(screen.getByText('Rename'));
        const input = screen.getByDisplayValue('Fellowship');
        await userEvent.clear(input);
        await userEvent.type(input, 'The Two Towers{enter}');
        expect(onRename).toHaveBeenCalledWith(1, 'The Two Towers');
    });

    it('clicking a project row while renaming does not trigger onOpen', async () => {
        const onOpen = jest.fn();
        render(<ProjectList projects={projects} onOpen={onOpen} onCreate={jest.fn()} onRename={jest.fn()} onDelete={jest.fn()} />);
        await userEvent.click(screen.getAllByRole('button', { name: /project options/i })[0]);
        await userEvent.click(screen.getByText('Rename'));
        const input = screen.getByDisplayValue('Fellowship');
        fireEvent.click(input);
        expect(onOpen).not.toHaveBeenCalled();
    });
});
