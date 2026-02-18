import { timingSafeEqual, constantTimeEqual, hexToBytes, bytesToHex } from '../src/timing-safe';

describe('constantTimeEqual', () => {
  it('should return true for identical Uint8Arrays', () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([1, 2, 3, 4]);
    expect(constantTimeEqual(a, b)).toBe(true);
  });

  it('should return false for different Uint8Arrays', () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([1, 2, 3, 5]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it('should return false for different lengths', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3, 4]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it('should handle empty arrays', () => {
    const a = new Uint8Array([]);
    const b = new Uint8Array([]);
    expect(constantTimeEqual(a, b)).toBe(true);
  });

  it('should detect single byte difference', () => {
    const a = new Uint8Array([0xFF, 0xFF, 0xFF]);
    const b = new Uint8Array([0xFF, 0xFE, 0xFF]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });
});

describe('timingSafeEqual', () => {
  it('should return true for identical strings', () => {
    expect(timingSafeEqual('hello', 'hello')).toBe(true);
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
  });

  it('should return false for different strings', () => {
    expect(timingSafeEqual('hello', 'world')).toBe(false);
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
  });

  it('should return false for strings of different lengths', () => {
    expect(timingSafeEqual('hello', 'helloworld')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });

  it('should handle empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true);
    expect(timingSafeEqual('', 'hello')).toBe(false);
  });

  it('should be case-sensitive', () => {
    expect(timingSafeEqual('Hello', 'hello')).toBe(false);
    expect(timingSafeEqual('ABC', 'abc')).toBe(false);
  });

  it('should handle unicode strings', () => {
    expect(timingSafeEqual('🚀', '🚀')).toBe(true);
    expect(timingSafeEqual('café', 'café')).toBe(true);
    expect(timingSafeEqual('café', 'cafe')).toBe(false);
  });
});

describe('hexToBytes', () => {
  it('should convert hex string to Uint8Array', () => {
    const result = hexToBytes('48656c6c6f'); // "Hello"
    expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it('should handle uppercase hex', () => {
    const result = hexToBytes('DEADBEEF');
    expect(result).toEqual(new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]));
  });

  it('should handle mixed case hex', () => {
    const result = hexToBytes('DeAdBeEf');
    expect(result).toEqual(new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]));
  });

  it('should handle hex with leading/trailing spaces', () => {
    const result = hexToBytes('  abc123  ');
    expect(result).toEqual(new Uint8Array([0xAB, 0xC1, 0x23]));
  });

  it('should handle empty string', () => {
    const result = hexToBytes('');
    expect(result).toEqual(new Uint8Array([]));
  });

  it('should throw on odd length hex', () => {
    expect(() => hexToBytes('abc')).toThrow('Invalid hex length');
    expect(() => hexToBytes('a')).toThrow('Invalid hex length');
    expect(() => hexToBytes('12345')).toThrow('Invalid hex length');
  });

    it('should throw on invalid hex characters', () => {
    // Even-length invalid hex strings (no odd-length strings)
    expect(() => hexToBytes('gg')).toThrow('Invalid hex characters');
    expect(() => hexToBytes('zzzz')).toThrow('Invalid hex characters');
    expect(() => hexToBytes('wxyz')).toThrow('Invalid hex characters');
    expect(() => hexToBytes('ab!@')).toThrow('Invalid hex characters');
    expect(() => hexToBytes('ghij')).toThrow('Invalid hex characters');
    expect(() => hexToBytes('1234xy')).toThrow('Invalid hex characters');
    });
});

describe('bytesToHex', () => {
  it('should convert Uint8Array to hex string', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    expect(bytesToHex(bytes)).toBe('48656c6c6f');
  });

  it('should handle empty array', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('');
  });

  it('should pad single digit hex', () => {
    const bytes = new Uint8Array([0x01, 0x0F, 0xFF]);
    expect(bytesToHex(bytes)).toBe('010fff');
  });

  it('should round-trip with hexToBytes', () => {
    const original = 'deadbeef';
    const bytes = hexToBytes(original);
    const result = bytesToHex(bytes);
    expect(result).toBe(original);
  });
});
