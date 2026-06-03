import { getAssociations, createAssociation, deleteAssociation } from './associations';

beforeEach(() => {
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.resetAllMocks();
});

function mockFetch(body) {
    global.fetch.mockResolvedValue({
        json: () => Promise.resolve(body),
    });
}

describe('getAssociations', () => {
    it('calls GET /api/entities/:id/associations and returns parsed JSON', async () => {
        const data = [{ id: 1, description: 'rivals' }];
        mockFetch(data);
        const result = await getAssociations(7);
        expect(fetch).toHaveBeenCalledWith('/api/entities/7/associations');
        expect(result).toEqual(data);
    });
});

describe('createAssociation', () => {
    it('calls POST /api/associations with body and returns parsed JSON', async () => {
        const payload = { entity_id_1: 1, entity_id_2: 2, description: 'allies' };
        mockFetch({ id: 10, ...payload });
        const result = await createAssociation(payload);
        expect(fetch).toHaveBeenCalledWith('/api/associations', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }));
        expect(result.description).toBe('allies');
    });
});

describe('deleteAssociation', () => {
    it('calls DELETE /api/associations/:id', async () => {
        global.fetch.mockResolvedValue({});
        await deleteAssociation(3);
        expect(fetch).toHaveBeenCalledWith('/api/associations/3', { method: 'DELETE' });
    });
});
