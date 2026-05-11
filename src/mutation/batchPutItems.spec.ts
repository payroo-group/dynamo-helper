import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { testClient, testTableConf } from '../testUtils';
import { batchPutItems as batchPutItemsMethod } from './batchPutItems';

describe('batchPutItems', () => {
  const createFilledArray = (count: number): Array<object> => Array.from({ length: count }, () => ({}));
  const batchPutItems = batchPutItemsMethod.bind(
    null,
    testClient,
    testTableConf,
  );
  const spy = jest.spyOn(testClient, 'send');

  beforeEach(() => {
    spy.mockClear();
    spy.mockResolvedValue({});
  });

  test('exports function', () => {
    expect(typeof batchPutItems).toBe('function');
  });

  test('promise rejection', async () => {
    spy.mockRejectedValue([]);
    await expect(batchPutItems([{}, {}])).rejects.toStrictEqual([]);
  });

  test('chunks items to bits of 25 items', async () => {
    await batchPutItems([{}, {}]);
    expect(spy).toHaveBeenCalledTimes(1);

    await batchPutItems(createFilledArray(50));
    expect(spy).toHaveBeenCalledTimes(3);

    await batchPutItems(createFilledArray(201));
    expect(spy).toHaveBeenCalledTimes(12);
  });

  test('uses batchWrite correctly', async () => {
    await batchPutItems([
      { pk: 'x', sk: '1' },
      { pk: 'y', sk: '2' },
    ]);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      input: {
        RequestItems: {
          [testTableConf.name]: [
            {
              PutRequest: {
                Item: { pk: 'x', sk: '1' },
              },
            },
            {
              PutRequest: {
                Item: { pk: 'y', sk: '2' },
              },
            },
          ],
        },
      }
    }));
  });
});
