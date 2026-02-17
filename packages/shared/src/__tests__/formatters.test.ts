import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  truncateString,
  capitalizeFirstLetter,
} from '../utils/formatters';

describe('formatNumber', () => {
  it('formats small numbers without separators', () => {
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with comma separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles negative numbers', () => {
    expect(formatNumber(-1500)).toBe('-1,500');
  });

  it('handles decimal numbers', () => {
    const result = formatNumber(1234.56);
    expect(result).toContain('1,234');
  });
});

describe('truncateString', () => {
  it('returns original string when shorter than maxLength', () => {
    expect(truncateString('hello', 10)).toBe('hello');
  });

  it('returns original string when exactly maxLength', () => {
    expect(truncateString('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis when longer than maxLength', () => {
    expect(truncateString('hello world', 5)).toBe('hello...');
  });

  it('handles empty string', () => {
    expect(truncateString('', 5)).toBe('');
  });

  it('handles maxLength of 0', () => {
    expect(truncateString('hello', 0)).toBe('...');
  });
});

describe('capitalizeFirstLetter', () => {
  it('capitalizes lowercase first letter', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello');
  });

  it('keeps already capitalized string unchanged', () => {
    expect(capitalizeFirstLetter('Hello')).toBe('Hello');
  });

  it('handles single character', () => {
    expect(capitalizeFirstLetter('a')).toBe('A');
  });

  it('handles empty string', () => {
    expect(capitalizeFirstLetter('')).toBe('');
  });

  it('only capitalizes the first letter', () => {
    expect(capitalizeFirstLetter('hello world')).toBe('Hello world');
  });
});
