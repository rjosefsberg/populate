import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-bootstrap Modal to avoid jsdom CSS issues
jest.mock('react-bootstrap/Modal', () => {
    const Modal = ({ show, children, onHide }) => show ? <div data-testid="modal">{children}</div> : null;
    Modal.Header = ({ children }) => <div>{children}</div>;
    Modal.Title = ({ children }) => <div>{children}</div>;
    Modal.Body = ({ children }) => <div>{children}</div>;
    Modal.Footer = ({ children }) => <div>{children}</div>;
    return Modal;
});

import AddEntityModal from './AddEntityModal';

const entities = [
    { id: 1, title: 'Gandalf', body: 'A wizard.' },
    { id: 2, title: 'Frodo', body: 'A hobbit.' },
];

describe('AddEntityModal', () => {
    it('renders form step when shown', () => {
        render(
            <AddEntityModal
                show={true}
                onHide={jest.fn()}
                onGenerate={jest.fn()}
                onConfirm={jest.fn()}
                entities={[]}
            />
        );
        expect(screen.getByText('Create Entity')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter a name/i)).toBeInTheDocument();
    });

    it('does not render when show is false', () => {
        render(
            <AddEntityModal
                show={false}
                onHide={jest.fn()}
                onGenerate={jest.fn()}
                onConfirm={jest.fn()}
                entities={[]}
            />
        );
        expect(screen.queryByText('Create Entity')).not.toBeInTheDocument();
    });

    it('shows association rows section when entities provided', () => {
        render(
            <AddEntityModal
                show={true}
                onHide={jest.fn()}
                onGenerate={jest.fn()}
                onConfirm={jest.fn()}
                entities={entities}
            />
        );
        expect(screen.getByText(/associations/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /\+ add association/i })).toBeInTheDocument();
    });

    it('does not show association rows when no entities', () => {
        render(
            <AddEntityModal
                show={true}
                onHide={jest.fn()}
                onGenerate={jest.fn()}
                onConfirm={jest.fn()}
                entities={[]}
            />
        );
        expect(screen.queryByRole('button', { name: /\+ add association/i })).not.toBeInTheDocument();
    });

    it('can add and remove association rows', async () => {
        render(
            <AddEntityModal
                show={true}
                onHide={jest.fn()}
                onGenerate={jest.fn()}
                onConfirm={jest.fn()}
                entities={entities}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /\+ add association/i }));
        await waitFor(() => {
            expect(screen.getByRole('option', { name: /select entity/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('×'));
        await waitFor(() => {
            expect(screen.queryByRole('option', { name: /select entity/i })).not.toBeInTheDocument();
        });
    });

    it('advances to preview step after generate', async () => {
        const onGenerate = jest.fn().mockResolvedValue({ description: 'A wise old wizard.' });

        render(
            <AddEntityModal
                show={true}
                onHide={jest.fn()}
                onGenerate={onGenerate}
                onConfirm={jest.fn()}
                entities={[]}
            />
        );

        await userEvent.type(screen.getByPlaceholderText(/enter a name/i), 'Gandalf');
        fireEvent.click(screen.getByRole('button', { name: /generate/i }));

        await waitFor(() => {
            expect(screen.getByText('Preview')).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue('A wise old wizard.')).toBeInTheDocument();
    });
});
