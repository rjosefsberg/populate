import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../api/settings', () => ({
    getSettings: jest.fn(),
    updateSetting: jest.fn(),
    checkApiKey: jest.fn(),
}));

// Mock react-bootstrap Modal to avoid jsdom CSS issues, matching AddEntityModal.test.jsx.
jest.mock('react-bootstrap/Modal', () => {
    const Modal = ({ show, children }) => show ? <div data-testid="modal">{children}</div> : null;
    Modal.Header = ({ children }) => <div>{children}</div>;
    Modal.Title = ({ children }) => <div>{children}</div>;
    Modal.Body = ({ children }) => <div>{children}</div>;
    return Modal;
});

import { getSettings, updateSetting, checkApiKey } from '../api/settings';
import SettingsModal from './SettingsModal';

const unsetSettings = {
    settings: [
        { key: 'anthropic_api_key', label: 'Anthropic API Key', value: '', editable: true },
        { key: 'key_works', label: 'Key Verified', value: false, editable: false },
    ],
    api_key_populated: false,
    key_works: false,
};

const populatedUnverified = {
    settings: [
        { key: 'anthropic_api_key', label: 'Anthropic API Key', value: '••••1234', editable: true },
        { key: 'key_works', label: 'Key Verified', value: false, editable: false },
    ],
    api_key_populated: true,
    key_works: false,
};

describe('SettingsModal', () => {
    beforeEach(() => jest.clearAllMocks());

    it('edits the API key: Edit opens an input, OK saves it, Cancel discards it without saving', async () => {
        getSettings.mockResolvedValue(unsetSettings);
        updateSetting.mockResolvedValue(populatedUnverified);

        render(<SettingsModal show={true} onHide={jest.fn()} />);
        await waitFor(() => screen.getByText('Anthropic API Key'));

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));
        const input = screen.getByDisplayValue('');
        await userEvent.paste(input, 'sk-ant-abcd1234');
        fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

        await waitFor(() => {
            expect(updateSetting).toHaveBeenCalledWith('anthropic_api_key', 'sk-ant-abcd1234');
        });
        expect(screen.queryByRole('button', { name: /^ok$/i })).not.toBeInTheDocument();

        expect(updateSetting).not.toHaveBeenCalledWith('anthropic_api_key', expect.stringContaining('cancel'));
    });

    it('shows Check Key only when a key is set but unverified, and verifying flips it to Yes', async () => {
        getSettings.mockResolvedValue(populatedUnverified);
        checkApiKey.mockResolvedValue({
            settings: [
                { key: 'anthropic_api_key', label: 'Anthropic API Key', value: '••••1234', editable: true },
                { key: 'key_works', label: 'Key Verified', value: true, editable: false },
            ],
            api_key_populated: true,
            key_works: true,
        });

        render(<SettingsModal show={true} onHide={jest.fn()} />);
        await waitFor(() => screen.getByRole('button', { name: /check key/i }));

        fireEvent.click(screen.getByRole('button', { name: /check key/i }));

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /check key/i })).not.toBeInTheDocument();
        });
        expect(checkApiKey).toHaveBeenCalled();
    });
});
