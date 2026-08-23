import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
});
