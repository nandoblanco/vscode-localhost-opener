"use strict";

const vscode = require('vscode');

class UrlProvider {
  constructor(context) {
    this._emitter = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._emitter.event;
    if (context && context.subscriptions) {
      context.subscriptions.push(
        this._emitter,
        vscode.window.onDidChangeActiveTextEditor(() => this._emitter.fire()),
        vscode.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration('localhostOpener.roots')) {
            this._emitter.fire();
          }
        })
      );
    }
  }

  getTreeItem(item) { return item; }

  getChildren() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') {
      return [new UrlItem('Open a file, then click the globe to open it in localhost', 'hint')];
    }
    const url = fileToUrl(editor.document.uri.fsPath);
    if (!url) {
      return [new UrlItem('No localhost root matches this file (click to add)', 'hint', {
        command: 'localhostOpener.addRoot',
        title: 'Add Document Root'
      })];
    }
    const item = new UrlItem(url, 'url', {
      command: 'localhostOpener.open',
      title: 'Open in browser'
    });
    return [item];
  }
}

class UrlItem extends vscode.TreeItem {
  constructor(label, contextValue, command) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = contextValue;
    this.command = command;
  }
}

function isSafeHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

function fileToUrl(fsPath) {
  if (!fsPath || typeof fsPath !== 'string') return null;
  const roots = vscode.workspace.getConfiguration('localhostOpener').get('roots', []);
  if (!Array.isArray(roots)) return null;
  const norm = fsPath.replace(/\\/g, '/');
  // longest matching path wins
  const matches = roots
    .filter(r => r && typeof r.path === 'string' && typeof r.url === 'string' && isSafeHttpUrl(r.url))
    .map(r => ({ root: r.path.replace(/\\/g, '/').replace(/\/+$/, ''), url: r.url.trim().replace(/\/+$/, '') }))
    .filter(r => r.root && norm.toLowerCase().startsWith(r.root.toLowerCase() + '/'))
    .sort((a, b) => b.root.length - a.root.length);
  if (!matches.length) return null;
  const m = matches[0];
  const rel = norm.slice(m.root.length);
  return m.url + encodeURI(rel);
}

async function openUrl(url) {
  if (!isSafeHttpUrl(url)) return;
  const mode = vscode.workspace.getConfiguration('localhostOpener').get('browser', 'system');
  if (mode === 'simple') {
    await openSplit(url);
    return;
  }
  await vscode.env.openExternal(vscode.Uri.parse(url));
}

// --- split-pane live preview ---

let lastSplitUrl = null;
let hasIntegratedBrowserCmd = null;

async function supportsIntegratedBrowser() {
  if (hasIntegratedBrowserCmd !== null) return hasIntegratedBrowserCmd;
  const cmds = await vscode.commands.getCommands(true);
  hasIntegratedBrowserCmd = cmds.includes('workbench.action.browser.open');
  return hasIntegratedBrowserCmd;
}

function isBrowserPreviewOpen() {
  if (!vscode.window.tabGroups || !vscode.window.tabGroups.all) return false;
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (!tab.input) {
        return true;
      }
      const viewType = tab.input.viewType ? String(tab.input.viewType) : '';
      if (viewType.includes('simpleBrowser')) {
        return true;
      }
    }
  }
  return false;
}

async function openSplit(url) {
  if (!isSafeHttpUrl(url)) return;
  const prevEditor = vscode.window.activeTextEditor;
  lastSplitUrl = url;
  if (await supportsIntegratedBrowser()) {
    await vscode.commands.executeCommand('workbench.action.browser.open', {
      url,
      openToSide: true,
      reuseUrlFilter: url
    });
    await vscode.commands.executeCommand('workbench.action.browser.hardReload');
    if (prevEditor && !prevEditor.document.isClosed) {
      await vscode.window.showTextDocument(prevEditor.document, {
        viewColumn: prevEditor.viewColumn,
        preserveFocus: false,
        selection: prevEditor.selection
      });
    }
    return;
  }
  await vscode.commands.executeCommand('simpleBrowser.api.open', url, {
    viewColumn: vscode.ViewColumn.Beside,
    preserveFocus: true
  });
}

function trackSave(context) {
  if (vscode.window.tabGroups && vscode.window.tabGroups.onDidChangeTabs) {
    vscode.window.tabGroups.onDidChangeTabs(() => {
      if (!isBrowserPreviewOpen()) {
        lastSplitUrl = null;
      }
    }, null, context.subscriptions);
  }

  vscode.workspace.onDidSaveTextDocument((doc) => {
    if (!lastSplitUrl) return;
    if (doc.uri.scheme !== 'file') return;
    const savedUrl = fileToUrl(doc.uri.fsPath);
    if (!savedUrl) return;
    if (!isBrowserPreviewOpen()) {
      lastSplitUrl = null;
      return;
    }
    // saving any mapped file reloads every open preview
    openSplit(lastSplitUrl);
  }, null, context.subscriptions);
}

async function promptAddRoot() {
  const picked = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Select Document Root (MAMP / XAMPP)'
  });
  if (!picked || !picked.length) return;
  const folderPath = picked[0].fsPath;

  const rawUrl = await vscode.window.showInputBox({
    title: 'Localhost Base URL',
    prompt: 'Enter the localhost URL that serves this document root (e.g. http://localhost or http://localhost:8888)',
    value: 'http://localhost',
    ignoreFocusOut: true,
    validateInput: (val) => {
      if (!isSafeHttpUrl(val)) {
        return 'URL must start with http:// or https://';
      }
      return null;
    }
  });
  if (!rawUrl || !isSafeHttpUrl(rawUrl)) return;
  const cleanUrl = rawUrl.trim().replace(/\/+$/, '');

  const config = vscode.workspace.getConfiguration('localhostOpener');
  const existing = config.get('roots', []);
  const safeExisting = Array.isArray(existing)
    ? existing.filter(r => r && typeof r.path === 'string' && typeof r.url === 'string')
    : [];
  const normNew = folderPath.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  const updated = safeExisting.filter(r => r.path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase() !== normNew);
  updated.push({ path: folderPath, url: cleanUrl });

  await config.update('roots', updated, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`Added localhost root: ${folderPath} -> ${cleanUrl}`);
}

async function warnNoRoot() {
  const choice = await vscode.window.showWarningMessage(
    'No localhost root matches this file.',
    'Add Document Root...'
  );
  if (choice === 'Add Document Root...') {
    await promptAddRoot();
  }
}


function activate(context) {
  const provider = new UrlProvider(context);
  const treeView = vscode.window.createTreeView('localhostOpener.view', { treeDataProvider: provider });
  context.subscriptions.push(
    treeView,
    treeView.onDidChangeVisibility((e) => {
      if (!e.visible) return;
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.uri.scheme === 'file') {
        const url = fileToUrl(editor.document.uri.fsPath);
        if (url) {
          openUrl(url);
          vscode.commands.executeCommand('workbench.view.explorer');
        }
      }
    })
  );

  trackSave(context);

  context.subscriptions.push(vscode.commands.registerCommand('localhostOpener.addRoot', async () => {
    await promptAddRoot();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('localhostOpener.open', async (item) => {
    let url = item && isSafeHttpUrl(item.label) ? item.label : null;
    if (!url) {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.uri.scheme !== 'file') {
        vscode.window.showWarningMessage('No active file to open.');
        return;
      }
      url = fileToUrl(editor.document.uri.fsPath);
      if (!url) {
        await warnNoRoot();
        return;
      }
    }
    openUrl(url);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('localhostOpener.copy', (item) => {
    if (item && item.label) vscode.env.clipboard.writeText(item.label);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('localhostOpener.openSplit', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') {
      vscode.window.showWarningMessage('No active file to open.');
      return;
    }
    const url = fileToUrl(editor.document.uri.fsPath);
    if (!url) {
      await warnNoRoot();
      return;
    }
    openSplit(url);
  }));

  // Right-click handlers: accept the clicked file URI (single or multi-select)
  const fromUri = async (uri, openFn) => {
    if (!uri || uri.scheme !== 'file') {
      vscode.window.showWarningMessage('No file selected.');
      return;
    }
    const url = fileToUrl(uri.fsPath);
    if (!url) {
      await warnNoRoot();
      return;
    }
    openFn(url);
  };

  context.subscriptions.push(vscode.commands.registerCommand('localhostOpener.openFromExplorer', async (uri) => {
    await fromUri(uri, openUrl);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('localhostOpener.openSplitFromExplorer', async (uri) => {
    await fromUri(uri, openSplit);
  }));
}

function deactivate() {}

module.exports = { activate, deactivate, fileToUrl };
