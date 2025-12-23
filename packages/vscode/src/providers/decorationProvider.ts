import * as vscode from 'vscode';
import { extractReferences } from '@ub/at-ref';

export class AtReferenceDecorationProvider implements vscode.Disposable {
  private decorationType: vscode.TextEditorDecorationType;
  private disposables: vscode.Disposable[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_DELAY = 300;

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editorInfo.background'),
      borderWidth: '0 0 2px 0',
      borderStyle: 'solid',
      borderColor: new vscode.ThemeColor('editorInfo.foreground')
    });

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

  private decorateEditor(editor: vscode.TextEditor): void {
    const refs = extractReferences(editor.document.getText(), { zeroIndexed: true });
    const decorations: vscode.DecorationOptions[] = refs.map(ref => ({
      range: new vscode.Range(ref.line, ref.column, ref.line, ref.column + ref.raw.length)
    }));
    editor.setDecorations(this.decorationType, decorations);
  }

  dispose(): void {
    this.decorationType.dispose();
    for (const timer of this.debounceTimers.values()) clearTimeout(timer);
    this.debounceTimers.clear();
    for (const disposable of this.disposables) disposable.dispose();
    this.disposables = [];
  }
}
