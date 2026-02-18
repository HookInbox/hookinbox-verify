import { timingSafeEqual } from '../src/timing-safe';

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
});
