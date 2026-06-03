import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddEntityForm from './AddEntityForm';

describe('AddEntityForm', () => {
    it('renders genre and type selects and name input', () => {
        render(<AddEntityForm onAdd={jest.fn()} />);
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBe(2);
        expect(screen.getByPlaceholderText(/enter a name/i)).toBeInTheDocument();
    });

    it('genre select has fantasy as default value', () => {
        render(<AddEntityForm onAdd={jest.fn()} />);
        const selects = screen.getAllByRole('combobox');
        // Genre is the first select
        expect(selects[0].value).toBe('fantasy');
    });

    it('type select has person as default value', () => {
        render(<AddEntityForm onAdd={jest.fn()} />);
        const selects = screen.getAllByRole('combobox');
        // Type is the second select
        expect(selects[1].value).toBe('person');
    });

    it('calls onAdd with name, entityType, genre on submit', async () => {
        const onAdd = jest.fn().mockResolvedValue(undefined);
        render(<AddEntityForm onAdd={onAdd} />);

        const selects = screen.getAllByRole('combobox');
        await userEvent.type(screen.getByPlaceholderText(/enter a name/i), 'Gandalf');
        fireEvent.change(selects[1], { target: { value: 'person' } });
        fireEvent.change(selects[0], { target: { value: 'sci-fi' } });
        fireEvent.click(screen.getByRole('button', { name: /generate/i }));

        expect(onAdd).toHaveBeenCalledWith('Gandalf', 'person', 'sci-fi');
    });

    it('does not submit when name is empty', () => {
        const onAdd = jest.fn();
        render(<AddEntityForm onAdd={onAdd} />);
        fireEvent.click(screen.getByRole('button', { name: /generate/i }));
        expect(onAdd).not.toHaveBeenCalled();
    });

    it('disables button while loading then re-enables', async () => {
        const onAdd = jest.fn().mockResolvedValue(undefined);
        render(<AddEntityForm onAdd={onAdd} />);

        await userEvent.type(screen.getByPlaceholderText(/enter a name/i), 'Aragorn');
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /generate/i }));
        });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /generate/i })).not.toBeDisabled();
        });
    });
});
