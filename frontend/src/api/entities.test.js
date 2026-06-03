import { getEntities, createEntity, updateEntity, deleteEntity, generateEntity } from './entities';

beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
    });
});

afterEach(() => {
    jest.resetAllMocks();
});

function mockFetch(body) {
    global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
    });
}

describe('getEntities', () => {
    it('calls GET /api/entities and returns parsed JSON', async () => {
        const data = [{ id: 1, title: 'Gandalf' }];
        mockFetch(data);
        const result = await getEntities();
        expect(fetch).toHaveBeenCalledWith('/api/entities', expect.objectContaining({
            credentials: 'include',
        }));
        expect(result).toEqual(data);
    });
});

describe('createEntity', () => {
    it('calls POST /api/entities with body and returns parsed JSON', async () => {
        const entity = { title: 'Frodo', body: 'A hobbit.' };
        mockFetch({ id: 1, ...entity });
        const result = await createEntity(entity);
        expect(fetch).toHaveBeenCalledWith('/api/entities', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(entity),
        }));
        expect(result.title).toBe('Frodo');
    });
});

describe('updateEntity', () => {
    it('calls PUT /api/entities/:id with body and returns parsed JSON', async () => {
        const updated = { title: 'Frodo Updated', body: 'Still a hobbit.' };
        mockFetch({ id: 42, ...updated });
        const result = await updateEntity(42, updated);
        expect(fetch).toHaveBeenCalledWith('/api/entities/42', expect.objectContaining({
            method: 'PUT',
            credentials: 'include',
            body: JSON.stringify(updated),
        }));
        expect(result.title).toBe('Frodo Updated');
    });
});

describe('deleteEntity', () => {
    it('calls DELETE /api/entities/:id', async () => {
        await deleteEntity(5);
        expect(fetch).toHaveBeenCalledWith('/api/entities/5', expect.objectContaining({
            method: 'DELETE',
            credentials: 'include',
        }));
    });
});

describe('generateEntity', () => {
    it('calls POST /api/entities/generate with required fields', async () => {
        mockFetch({ description: 'A brave warrior.' });
        const result = await generateEntity('person', 'Arthur', 'fantasy');
        expect(fetch).toHaveBeenCalledWith('/api/entities/generate', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
        }));
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.entity_type).toBe('person');
        expect(body.prompt).toBe('Arthur');
        expect(body.genre).toBe('fantasy');
        expect(result).toEqual({ description: 'A brave warrior.' });
    });

    it('defaults genre to fantasy when not provided', async () => {
        mockFetch({ description: 'A wise mage.' });
        await generateEntity('person', 'Merlin');
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.genre).toBe('fantasy');
    });

    it('includes hint when provided', async () => {
        mockFetch({ description: 'A dark figure.' });
        await generateEntity('person', 'Merlin', 'fantasy', 'make it dark');
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.hint).toBe('make it dark');
    });

    it('does not include hint when null', async () => {
        mockFetch({ description: 'A figure.' });
        await generateEntity('person', 'Merlin', 'fantasy', null);
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body).not.toHaveProperty('hint');
    });
});
