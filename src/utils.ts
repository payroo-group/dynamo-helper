import CryptoJS from 'crypto-js';

export const chunkArray = <T>(items: Array<T>, size: number): Array<Array<T>> => {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('size should be a positive integer');
  }
  const result: Array<Array<T>> = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

/**
 *
 * @param value
 * @param secret
 * @returns
 */
export const encrypt = <T>(value: T, secret: string): string => {
  if (value || typeof value !== 'undefined') {
    return CryptoJS.AES.encrypt(JSON.stringify({ value }), secret).toString();
  }
  return undefined;
};

/**
 *
 * @param value
 * @param secret
 * @returns
 */
export const decrypt = <T>(value: string, secret: string): T => {
  if (!value) {
    return undefined;
  }
  const wordArray = CryptoJS.AES.decrypt(value, secret);
  const json = JSON.parse(wordArray.toString(CryptoJS.enc.Utf8));
  return json.value;
};
