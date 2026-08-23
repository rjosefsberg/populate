import { chatWithAssistant } from './assist';

beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ reply: 'Here is an idea.' }),
    });
});

afterEach(() => {
    jest.resetAllMocks();
});

describe('chatWithAssistant', () => {
    it('calls POST /api/assist/chat with entity type, genre, and messages', async () => {
        const messages = [{ role: 'user', content: 'Give me an idea' }];
        const result = await chatWithAssistant('person', 'fantasy', messages);

        expect(fetch).toHaveBeenCalledWith('/api/assist/chat', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
        }));
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body).toEqual({ entity_type: 'person', genre: 'fantasy', messages });
        expect(result).toEqual({ reply: 'Here is an idea.' });
    });
});
