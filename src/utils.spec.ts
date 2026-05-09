import { chunkArray, decrypt, encrypt } from './utils';

describe('utils', () => {
  test('encrypt returns undefined for undefined input', () => {
    const value = encrypt(undefined, 'secret');
    expect(value).toBeUndefined();
  });
  test('decrypt returns undefined for undefined input', () => {
    const value = decrypt(undefined, 'secret');
    expect(value).toBeUndefined();
  });
  test('encrypt & decrypts the string', () => {
    const masked = encrypt('Hello World!', 'secret');
    const unmasked = decrypt(masked, 'secret');
    expect(unmasked).toBe('Hello World!');
  });
  test('encrypt & decrypts the object', () => {
    const masked = encrypt({ message: 'Hello World!' }, 'secret');
    const unmasked = decrypt(masked, 'secret');
    expect(unmasked).toStrictEqual({ message: 'Hello World!' });
  });
  test('chunkArray chunks arrays by given size', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toStrictEqual([[1, 2], [3, 4], [5]]);
  });
  test('chunkArray throws for non-positive chunk size', () => {
    expect(() => chunkArray([1, 2, 3], 0)).toThrow('size should be a positive integer');
    expect(() => chunkArray([1, 2, 3], -1)).toThrow('size should be a positive integer');
    expect(() => chunkArray([1, 2, 3], 2.5)).toThrow('size should be a positive integer');
  });
});
