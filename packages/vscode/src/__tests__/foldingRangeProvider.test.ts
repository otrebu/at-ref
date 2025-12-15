import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateFoldingRanges } from '../utils/foldingLogic';

describe('calculateFoldingRanges', () => {
  it('should create folding range for balanced tags', () => {
    const text = '<file path="test.md">\nContent\n</file>';
    const ranges = calculateFoldingRanges(text);

    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].start, 0);
    assert.strictEqual(ranges[0].end, 2);
  });

  it('should handle nested tags', () => {
    const text = '<file path="outer.md">\n<file path="inner.md">\nContent\n</file>\n</file>';
    const ranges = calculateFoldingRanges(text);

    assert.strictEqual(ranges.length, 2);
    // Inner fold (1-3)
    assert.strictEqual(ranges[0].start, 1);
    assert.strictEqual(ranges[0].end, 3);
    // Outer fold (0-4)
    assert.strictEqual(ranges[1].start, 0);
    assert.strictEqual(ranges[1].end, 4);
  });

  it('should ignore self-closing tags', () => {
    const text = '<file path="test.md" />\nSome content';
    const ranges = calculateFoldingRanges(text);

    assert.strictEqual(ranges.length, 0);
  });

  it('should not fold same-line tags', () => {
    const text = '<file path="test.md">Content</file>';
    const ranges = calculateFoldingRanges(text);

    assert.strictEqual(ranges.length, 0);
  });

  it('should handle unbalanced tags (extra closing)', () => {
    const text = '</file>\n<file path="test.md">\nContent\n</file>';
    const ranges = calculateFoldingRanges(text);

    // Should only create range for balanced pair
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].start, 1);
    assert.strictEqual(ranges[0].end, 3);
  });

  it('should handle unclosed tags', () => {
    const text = '<file path="test.md">\nContent\nMore content';
    const ranges = calculateFoldingRanges(text);

    // No closing tag, so no folding range
    assert.strictEqual(ranges.length, 0);
  });

  it('should ignore tags inside code blocks', () => {
    const text = '```markdown\n<file path="test.md">\nContent\n</file>\n```';
    const ranges = calculateFoldingRanges(text);

    assert.strictEqual(ranges.length, 0);
  });

  it('should handle multiple tags on same line', () => {
    const text = '<file path="a.md"><file path="b.md">\nContent\n</file></file>';
    const ranges = calculateFoldingRanges(text);

    assert.strictEqual(ranges.length, 2);
    // Inner fold
    assert.strictEqual(ranges[0].start, 0);
    assert.strictEqual(ranges[0].end, 2);
    // Outer fold
    assert.strictEqual(ranges[1].start, 0);
    assert.strictEqual(ranges[1].end, 2);
  });

  it('should handle code blocks with nested tags outside', () => {
    const text = '<file path="outer.md">\n```\n<file path="ignore.md">\n```\n<file path="inner.md">\nContent\n</file>\n</file>';
    const ranges = calculateFoldingRanges(text);

    // Should have outer (0-7) and inner (4-6)
    assert.strictEqual(ranges.length, 2);
  });
});
