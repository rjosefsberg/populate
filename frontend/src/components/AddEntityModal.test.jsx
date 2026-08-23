import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-bootstrap Modal to avoid jsdom CSS issues
jest.mock('react-bootstrap/Modal', () => {
    const Modal = ({ show, children }) => show ? <div data-testid="modal">{children}</div> : null;
    Modal.Header = ({ children }) => <div>{children}</div>;
    Modal.Title = ({ children }) => <div>{children}</div>;
    Modal.Body = ({ children }) => <div>{children}</div>;
    Modal.Footer = ({ children }) => <div>{children}</div>;
    return Modal;
});

// The rich-text editor is exercised in its own test suite; stub it here as a plain textarea
// so form-level behavior (title/body/confirm wiring) can be tested without ProseMirror overhead.
jest.mock('./RichTextEditor', () => ({ value, onChange, placeholder }) => (
    <textarea aria-label="body" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
));

import AddEntityModal from './AddEntityModal';

const entities = [
    { id: 1, title: 'Gandalf', body: 'A wizard.' },
    { id: 2, title: 'Frodo', body: 'A hobbit.' },
];

describe('AddEntityModal', () => {
    it('renders when shown', () => {
        render(<AddEntityModal show={true} onHide={jest.fn()} onConfirm={jest.fn()} entities={[]} />);
        expect(screen.getByText('Create Entity')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter a name/i)).toBeInTheDocument();
    });

    it('does not render when show is false', () => {
        render(<AddEntityModal show={false} onHide={jest.fn()} onConfirm={jest.fn()} entities={[]} />);
        expect(screen.queryByText('Create Entity')).not.toBeInTheDocument();
    });

    it('shows association rows section when entities provided', () => {
        render(<AddEntityModal show={true} onHide={jest.fn()} onConfirm={jest.fn()} entities={entities} />);
        expect(screen.getByText(/associations/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /\+ add association/i })).toBeInTheDocument();
    });

    it('does not show association rows when no entities', () => {
        render(<AddEntityModal show={true} onHide={jest.fn()} onConfirm={jest.fn()} entities={[]} />);
        expect(screen.queryByRole('button', { name: /\+ add association/i })).not.toBeInTheDocument();
    });

    it('can add and remove association rows', async () => {
        render(<AddEntityModal show={true} onHide={jest.fn()} onConfirm={jest.fn()} entities={entities} />);

        fireEvent.click(screen.getByRole('button', { name: /\+ add association/i }));
        await waitFor(() => {
            expect(screen.getByRole('option', { name: /select entity/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('×'));
        await waitFor(() => {
            expect(screen.queryByRole('option', { name: /select entity/i })).not.toBeInTheDocument();
        });
    });

    it('disables Create until both title and body are filled in', async () => {
        render(<AddEntityModal show={true} onHide={jest.fn()} onConfirm={jest.fn()} entities={[]} />);

        expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();

        await userEvent.type(screen.getByPlaceholderText(/enter a name/i), 'Gandalf');
        expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();

        fireEvent.change(screen.getByLabelText('body'), { target: { value: 'A wise old wizard.' } });
        expect(screen.getByRole('button', { name: /create/i })).not.toBeDisabled();
    });

    it('calls onConfirm with title, body, and valid associations, then closes', async () => {
        const onConfirm = jest.fn();
        const onHide = jest.fn();
        render(<AddEntityModal show={true} onHide={onHide} onConfirm={onConfirm} entities={entities} />);

        await userEvent.type(screen.getByPlaceholderText(/enter a name/i), 'Gandalf');
        fireEvent.change(screen.getByLabelText('body'), { target: { value: 'A wise old wizard.' } });

        fireEvent.click(screen.getByRole('button', { name: /create/i }));

        expect(onConfirm).toHaveBeenCalledWith('Gandalf', 'A wise old wizard.', []);
        expect(onHide).toHaveBeenCalled();
    });

    it('toggles the Get help panel', () => {
        render(<AddEntityModal show={true} onHide={jest.fn()} onConfirm={jest.fn()} entities={[]} />);
        expect(screen.queryByText(/ask for ideas/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /get help/i }));
        expect(screen.getByText(/ask for ideas/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /hide help/i }));
        expect(screen.queryByText(/ask for ideas/i)).not.toBeInTheDocument();
    });
});
