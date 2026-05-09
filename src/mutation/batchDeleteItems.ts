import { DynamoDBDocumentClient, BatchWriteCommand, BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { TableConfig, Key } from '../types';

function chunkArray<T>(items: Array<T>, size: number): Array<Array<T>> {
  const result: Array<Array<T>> = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export function batchDeleteItems(
  dbClient: DynamoDBDocumentClient,
  table: TableConfig,
  keys: Array<Key>,
): Promise<Array<BatchWriteCommandOutput>> {
  // batchWriteItem accepts maximum of 25 items, 16 MB total and 400KB per each item
  // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
  // Make chunks of 25 items
  const batches = chunkArray(keys, 25) as Array<Array<Key>>;

  return Promise.all(
    batches.map(x =>
      dbClient.send(new BatchWriteCommand({
        RequestItems: {
          [table.name]: x.map(key => ({
            DeleteRequest: {
              Key: key,
            },
          })),
        },
      })),
    ),
  );
}
