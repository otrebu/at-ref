import * as vscode from 'vscode';

export class AtReferenceFoldingRangeProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    _context: vscode.FoldingContext,
    _token: vscode.CancellationToken
  ): vscode.FoldingRange[] {
    const ranges: vscode.FoldingRange[] = [];
    const stack: number[] = []; // Stack to track opening tag line numbers
    const text = document.getText();
    const lines = text.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      if (!line) continue;

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
            ranges.push(new vscode.FoldingRange(startLine, lineNum, vscode.FoldingRangeKind.Region));
          }
        }
      }
    }

    return ranges;
  }
}
