/**
 * Core logic for calculating folding ranges from text content
 * Pure function with no vscode dependencies for testability
 */
export function calculateFoldingRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const stack: number[] = []; // Stack to track opening tag line numbers
  const lines = text.split('\n');
  let inCodeBlock = false;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    if (!line) continue;

    // Track code block boundaries (skip tags inside code blocks)
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip processing if inside code block
    if (inCodeBlock) continue;

    // Check if this line contains a self-closing tag - skip it
    const selfClosingPattern = /<file\s+path="[^"]*"\s*\/>/;
    if (selfClosingPattern.test(line)) {
      continue;
    }

    // Find all opening tags in this line
    const openTagPattern = /<file\s+path="[^"]*">/g;
    let openMatch;
    while ((openMatch = openTagPattern.exec(line)) !== null) {
      stack.push(lineNum);
    }

    // Find all closing tags in this line
    const closeTagPattern = /<\/file>/g;
    let closeMatch;
    while ((closeMatch = closeTagPattern.exec(line)) !== null) {
      if (stack.length > 0) {
        const startLine = stack.pop()!;
        // Create folding range from start to current line
        // Only fold if there's content between tags (not same line)
        if (lineNum > startLine) {
          ranges.push({ start: startLine, end: lineNum });
        }
      }
      // Edge case: closing tag without matching opening tag
      // Silently ignore - VSCode will handle gracefully
    }
  }

  // Edge case: unclosed tags remain in stack
  // Don't create folding ranges for unclosed tags (no valid end point)

  return ranges;
}
