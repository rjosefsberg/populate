import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RichTextEditor from './RichTextEditor';

describe('RichTextEditor', () => {
    it('renders the toolbar and initial content', async () => {
        render(<RichTextEditor value="<p>Hello</p>" onChange={jest.fn()} />);
        await waitFor(() => {
            expect(screen.getByText('Hello')).toBeInTheDocument();
        });
        expect(screen.getByTitle('Bold')).toBeInTheDocument();
        expect(screen.getByTitle('Italic')).toBeInTheDocument();
    });

    it('offers font family, font size, and font color controls', async () => {
        render(<RichTextEditor value="<p>Hello</p>" onChange={jest.fn()} />);
        await waitFor(() => screen.getByText('Hello'));

        expect(screen.getByLabelText('Font')).toBeInTheDocument();
        expect(screen.getByLabelText('Font size')).toBeInTheDocument();
        expect(screen.getByLabelText('Font color')).toBeInTheDocument();
    });

    it('offers paragraph alignment controls', async () => {
        render(<RichTextEditor value="<p>Hello</p>" onChange={jest.fn()} />);
        await waitFor(() => screen.getByText('Hello'));

        expect(screen.getByTitle('Align left')).toBeInTheDocument();
        expect(screen.getByTitle('Align center')).toBeInTheDocument();
        expect(screen.getByTitle('Align right')).toBeInTheDocument();
        expect(screen.getByTitle('Justify')).toBeInTheDocument();
    });

    it('applies font family, size, and color to newly typed text', async () => {
        const onChange = jest.fn();
        render(<RichTextEditor value="<p></p>" onChange={onChange} />);
        await waitFor(() => screen.getByLabelText('Font'));

        // Place the cursor in the editor, then set the marks — they apply to what's typed next.
        // (fireEvent.focus + userEvent.keyboard avoids userEvent.type's pointer simulation,
        // which needs document.elementFromPoint — unsupported by jsdom.)
        document.querySelector('.ProseMirror').focus();
        fireEvent.change(screen.getByLabelText('Font'), { target: { value: "'Courier New', Courier, monospace" } });
        fireEvent.change(screen.getByLabelText('Font size'), { target: { value: '20px' } });
        fireEvent.change(screen.getByLabelText('Font color'), { target: { value: '#ff0000' } });

        await userEvent.keyboard('Styled');

        await waitFor(() => {
            const html = onChange.mock.calls.at(-1)[0];
            expect(html).toContain('font-family');
            expect(html).toContain('font-size: 20px');
            expect(html).toContain('color: rgb(255, 0, 0)');
        });
    });

    it('inserts a table with the Table button and shows table editing controls', async () => {
        render(<RichTextEditor value="<p>Hello</p>" onChange={jest.fn()} />);
        await waitFor(() => screen.getByText('Hello'));

        expect(screen.queryByTitle('Add row after')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Table' }));

        await waitFor(() => {
            expect(document.querySelector('table')).toBeInTheDocument();
            expect(screen.getByTitle('Add row after')).toBeInTheDocument();
            expect(screen.getByTitle('Delete table')).toBeInTheDocument();
        });
    });
});
