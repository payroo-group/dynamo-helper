import { DynamoDBDocumentClient, BatchGetCommand, BatchGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { AnyObject, TableConfig, Key } from '../types';

function chunkArray<T>(items: Array<T>, size: number): Array<Array<T>> {
  const result: Array<Array<T>> = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function flattenArray<T>(items: Array<Array<T>>): Array<T> {
  return items.reduce((acc, current) => acc.concat(current), [] as Array<T>);
}

function keyByArray<T>(
  items: Array<T>,
  keySelector: (item: T) => string,
): Record<string, T> {
  return items.reduce((acc, current) => {
    acc[keySelector(current)] = current;
    return acc;
  }, {} as Record<string, T>);
}

/**
 * Get many items from the db matching the provided keys
 * @param keys array of key maps. eg: [{ pk: '1', sk: '2'}]
 * @param fields optional fields to project
 * @param consistentRead optional consistent read flag
 * @returns list of items
 */
export async function batchGetItems(
  dbClient: DynamoDBDocumentClient,
  table: TableConfig,
  keys: Array<Key>,
  fields?: Array<string>,
  consistentRead?: boolean,
): Promise<Array<AnyObject>> {
  let result: BatchGetCommandOutput;
  let unProcessedKeys = [];

  // Chunk requests to bits of 100s as max items per batchGet operation is 100
  // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
  if (keys.length > 100) {
    const results = await Promise.all(
      chunkArray(keys, 100).map(x => batchGetItems(dbClient, table, x, fields, consistentRead)),
    );
    return flattenArray(results);
  }

  const items = [];
  const { partitionKeyName, sortKeyName } = table.indexes.default;

  const fieldsToProject = fields ? [...fields] : undefined;

  // If projection fields is given, add tables primary keys there by default
  if (fieldsToProject) {
    if (!fieldsToProject.includes(partitionKeyName)) {
      fieldsToProject.push(partitionKeyName);
    }

    if (!fieldsToProject.includes(sortKeyName)) {
      fieldsToProject.push(sortKeyName);
    }
  }

  do {
    result = await dbClient.send(new BatchGetCommand({
      RequestItems: {
        [table.name]: {
          Keys: unProcessedKeys.length > 0 ? unProcessedKeys : keys,
          ProjectionExpression: fieldsToProject
            ? fieldsToProject.join(',')
            : undefined,
          ...(consistentRead !== undefined && { ConsistentRead: consistentRead }),
        },
      },
    }));

    if (result.UnprocessedKeys && result.UnprocessedKeys[table.name]) {
      unProcessedKeys = result.UnprocessedKeys[table.name].Keys;
    }

    items.push(...(result.Responses[table.name] || []));
  } while (unProcessedKeys.length > 0);

  // DynamoDB doesn't return results in any order
  // To support dataloader pattern, sort result in same order as keys
  const itemsHash = keyByArray(
    items,
    x => `${x[partitionKeyName]}::${x[sortKeyName]}`,
  );

  return keys.map(x => itemsHash[`${x[partitionKeyName]}::${x[sortKeyName]}`]);
}
