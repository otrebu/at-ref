import * as vscode from 'vscode';

export class FileTagDecorationProvider implements vscode.Disposable {
  private depthLineDecorations: vscode.TextEditorDecorationType[] = [];
  private pathDecorations: vscode.TextEditorDecorationType[] = [];
  private disposables: vscode.Disposable[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_DELAY = 300;

  private readonly COLORS = [
    'editorInfo.foreground',      // Blue (depth 0)
    'terminal.ansiGreen',          // Green (depth 1)
    'terminal.ansiMagenta',        // Purple (depth 2)
    'terminal.ansiYellow',         // Yellow (depth 3)
    'terminal.ansiCyan',           // Cyan (depth 4)
    'terminal.ansiRed'             // Red (depth 5)
  ];

  constructor() {
    // Create decoration types for 6 depth levels
    // Each depth gets a vertical line at a specific horizontal offset
    for (let i = 0; i < 6; i++) {
      this.depthLineDecorations.push(
        vscode.window.createTextEditorDecorationType({
          before: {
            contentText: '▏',  // Thin vertical bar character
            color: new vscode.ThemeColor(this.COLORS[i]),
            margin: `0 0 0 ${i * 6}px`,  // Offset based on depth
            width: '2px'
          }
        })
      );

      // Path attribute: bold + color
      this.pathDecorations.push(
        vscode.window.createTextEditorDecorationType({
          color: new vscode.ThemeColor(this.COLORS[i]),
          fontWeight: 'bold'
        })
      );
    }

    this.registerEventHandlers();
    this.decorateVisibleEditors();
  }

  private registerEventHandlers(): void {
    // Active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor?.document.languageId === 'markdown') {
          this.decorateEditor(editor);
        }
      })
    );

    // Visible editors change (split view)
    this.disposables.push(
      vscode.window.onDidChangeVisibleTextEditors(editors => {
        for (const editor of editors) {
          if (editor.document.languageId === 'markdown') {
            this.decorateEditor(editor);
          }
        }
      })
    );

    // Text changes (debounced)
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'markdown') {
          const editor = vscode.window.visibleTextEditors.find(
            e => e.document.uri.toString() === event.document.uri.toString()
          );
          if (editor) this.debouncedDecorate(editor);
        }
      })
    );

    // Cleanup on document close
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument(doc => {
        const key = doc.uri.toString();
        const timer = this.debounceTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(key);
        }
      })
    );
  }

  private decorateVisibleEditors(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.languageId === 'markdown') {
        this.decorateEditor(editor);
      }
    }
  }

  private debouncedDecorate(editor: vscode.TextEditor): void {
    const key = editor.document.uri.toString();
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.decorateEditor(editor);
      this.debounceTimers.delete(key);
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Calculate which depth levels are active on each line
   * Returns a map of line number → array of active depth indices
   */
  private calculateActiveDepthsPerLine(document: vscode.TextDocument): Map<number, number[]> {
    const lineDepths = new Map<number, number[]>();
    const stack: number[] = []; // Stack of active depth indices
    const lines = document.getText().split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      // Skip self-closing tags
      const selfClosingPattern = /<file\s+path="[^"]*"\s*\/>/;
      if (selfClosingPattern.test(line)) {
        continue;
      }

      // BEFORE processing this line's tags, record current active depths
      // (This ensures opening tag line shows its parent depths, not itself)
      lineDepths.set(lineNum, [...stack]);

      // Process opening tags on this line
      const openPattern = /<file\s+path="[^"]*">/g;
      let match;
      while ((match = openPattern.exec(line)) !== null) {
        const depth = stack.length % 6; // Cycle through 0-5
        stack.push(depth);
      }

      // Process closing tags on this line
      const closePattern = /<\/file>/g;
      while ((match = closePattern.exec(line)) !== null) {
        if (stack.length > 0) {
          stack.pop();
        }
      }
    }

    return lineDepths;
  }

  private decorateEditor(editor: vscode.TextEditor): void {
    const lines = editor.document.getText().split('\n');

    // Calculate active depths for each line
    const lineDepths = this.calculateActiveDepthsPerLine(editor.document);

    // Collect decoration ranges for each depth level
    // depthRanges[depth] = array of ranges where that depth should show a line
    const depthRanges: vscode.DecorationOptions[][] = [[], [], [], [], [], []];
    const pathRanges: vscode.DecorationOptions[][] = [[], [], [], [], [], []];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      const activeDepths = lineDepths.get(lineNum) || [];

      // Apply decorations for ALL active depths on this line
      for (const depth of activeDepths) {
        depthRanges[depth].push({
          range: new vscode.Range(lineNum, 0, lineNum, 0)
        });
      }

      // Parse path attributes for highlighting (separate from depth lines)
      const openPattern = /<file\s+path="([^"]*)">/g;
      let match;
      while ((match = openPattern.exec(line)) !== null) {
        // Determine depth for this opening tag
        const currentStackDepth = activeDepths.length; // Depth before this tag was added
        const tagDepth = currentStackDepth % 6;

        const pathStart = match.index + match[0].indexOf(match[1]);
        pathRanges[tagDepth].push({
          range: new vscode.Range(lineNum, pathStart, lineNum, pathStart + match[1].length)
        });
      }
    }

    // Apply all decorations
    for (let i = 0; i < 6; i++) {
      editor.setDecorations(this.depthLineDecorations[i], depthRanges[i]);
      editor.setDecorations(this.pathDecorations[i], pathRanges[i]);
    }
  }

  dispose(): void {
    for (const decoration of this.depthLineDecorations) decoration.dispose();
    for (const decoration of this.pathDecorations) decoration.dispose();

    for (const timer of this.debounceTimers.values()) clearTimeout(timer);
    this.debounceTimers.clear();

    for (const disposable of this.disposables) disposable.dispose();
    this.disposables = [];
  }
}
