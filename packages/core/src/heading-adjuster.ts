import type { AtReference, Heading, HeadingContext } from './types';

/**
 * Find all excluded ranges in the content (code blocks and file tags)
 * to exclude them from heading detection and adjustment
 */
export function findExcludedRanges(content: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];

  // Match fenced code blocks first (``` ... ```) as they take precedence
  const codeBlockPattern = /```[\s\S]*?```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockPattern.exec(content)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Match inline code (` ... `) but not inside code blocks
  const inlineCodePattern = /`[^`\n]+`/g;

  while ((match = inlineCodePattern.exec(content)) !== null) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    // Check if this inline code is inside a code block
    const isInsideCodeBlock = ranges.some(
      range => matchStart >= range.start && matchEnd <= range.end
    );

    if (!isInsideCodeBlock) {
      ranges.push({
        start: matchStart,
        end: matchEnd,
      });
    }
  }

  // Match <file ...>...</file> blocks and self-closing <file .../> tags
  const fileBlockPattern = /<file\s[^>]*>[\s\S]*?<\/file>|<file\s[^>]*\/>/g;

  while ((match = fileBlockPattern.exec(content)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return ranges;
}

/**
 * @deprecated Use findExcludedRanges instead
 */
export function findCodeBlockRanges(content: string): Array<{ start: number; end: number }> {
  return findExcludedRanges(content);
}

/**
 * Check if an offset falls within any code block range
 */
export function isInsideCodeBlock(
  offset: number,
  codeRanges: Array<{ start: number; end: number }>
): boolean {
  return codeRanges.some(range => offset >= range.start && offset < range.end);
}

/**
 * Extract all ATX-style markdown headings (# to ######) from content,
 * excluding headings inside code blocks
 */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const excludedRanges = findExcludedRanges(content);

  // Match ATX headings: ^#{1,6}\s+.+$
  const headingPattern = /^(#{1,6})\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(content)) !== null) {
    // Skip if inside excluded range (code blocks or file tags)
    if (isInsideCodeBlock(match.index, excludedRanges)) {
      continue;
    }

    headings.push({
      level: match[1].length,
      position: match.index,
      text: match[2].trim(),
    });
  }

  return headings;
}

/**
 * Adjust all heading levels in content by the specified shift amount,
 * clamping at h6 (maximum markdown heading level)
 *
 * @param content The markdown content to adjust
 * @param shiftAmount Number of levels to shift (positive to increase depth)
 * @param warnOnClamp Whether to emit warnings when headings are clamped to h6
 * @param skipFileBlocks Whether to skip adjusting headings inside <file> tags (for recursive compilation)
 * @returns The content with adjusted heading levels
 */
export function adjustHeadings(
  content: string,
  shiftAmount: number,
  warnOnClamp: boolean = false,
  skipFileBlocks: boolean = false
): string {
  if (shiftAmount === 0) return content;

  const excludedRanges = skipFileBlocks ? findExcludedRanges(content) : findCodeBlockRanges(content);
  const headingPattern = /^(#{1,6})(\s+.+)$/gm;

  let adjusted = content;
  let offset = 0;
  let clampedCount = 0;

  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;

  // Collect all matches first (since we'll be modifying the string)
  while ((match = headingPattern.exec(content)) !== null) {
    if (!isInsideCodeBlock(match.index, excludedRanges)) {
      matches.push(match);
    }
  }

  // Process matches
  for (const match of matches) {
    const currentLevel = match[1].length;
    const targetLevel = currentLevel + shiftAmount;
    const newLevel = Math.min(targetLevel, 6); // Clamp to h6

    if (targetLevel > 6) {
      clampedCount++;
    }

    const newHashes = '#'.repeat(newLevel);
    const adjustedPos = match.index + offset;

    adjusted =
      adjusted.slice(0, adjustedPos) +
      newHashes +
      match[2] +
      adjusted.slice(adjustedPos + match[0].length);

    offset += (newLevel - currentLevel);
  }

  if (warnOnClamp && clampedCount > 0) {
    console.warn(`Warning: ${clampedCount} heading(s) clamped to h6 due to deep nesting`);
  }

  return adjusted;
}

/**
 * Analyze heading context for each @reference in the content.
 * Maps each reference to the last heading that appears before it.
 *
 * @param content The markdown content to analyze
 * @param references The @references found in the content
 * @returns Map from reference startIndex to its heading context
 */
export function analyzeHeadingContext(
  content: string,
  references: AtReference[]
): Map<number, HeadingContext> {
  const headings = extractHeadings(content);
  const contextMap = new Map<number, HeadingContext>();

  for (const ref of references) {
    // Find the last heading BEFORE this reference
    let precedingHeading: Heading | null = null;

    for (const heading of headings) {
      if (heading.position < ref.startIndex) {
        precedingHeading = heading;
      } else {
        break;
      }
    }

    const contextLevel = precedingHeading?.level ?? 0;

    contextMap.set(ref.startIndex, {
      contextLevel,
      shiftAmount: contextLevel,
    });
  }

  return contextMap;
}
