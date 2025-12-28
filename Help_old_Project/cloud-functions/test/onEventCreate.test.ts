import * as ftest from 'firebase-functions-test';
import { onEventCreate } from '../src/onEventCreate';

const test = ftest();

describe('onEventCreate', () => {
  let wrapped: any;

  beforeAll(() => {
    wrapped = test.wrap(onEventCreate);
  });

  afterAll(() => {
    test.cleanup();
  });

  it('should process new event and initialize metrics', async () => {
    // Mock event data
    const eventData = {
      title: 'Test Event',
      target: { departments: ['CSE'], years: [1] }
    };
    
    // Mock snapshot
    const snapshot = test.firestore.makeDocumentSnapshot(eventData, 'events/testEventId');
    
    // Mock update method
    const updateStub = jest.fn().mockResolvedValue({});
    snapshot.ref.update = updateStub;

    await wrapped(snapshot, { params: { eventId: 'testEventId' } });

    // Expect metrics update to be called
    expect(updateStub).toHaveBeenCalledWith(expect.objectContaining({
      metrics: expect.any(Object)
    }));
  });
});
