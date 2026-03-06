# Coding Guidelines

This document contains detailed coding guidelines for the Quota Monitor extension.

## reactive-vscode API Usage Guidelines

This project uses the `reactive-vscode` framework. For all VS Code native APIs that have corresponding `useXXX` reactive APIs, **must** prioritize using the reactive APIs provided by `reactive-vscode`.

### Priority reactive-vscode APIs

| Scenario | Native VS Code API | reactive-vscode Alternative |
|----------|-------------------|---------------------------|
| Command registration | `commands.registerCommand` | `useCommand`, `useCommands` |
| Text editor commands | `commands.registerTextEditorCommand` | `useTextEditorCommand`, `useTextEditorCommands` |
| Configuration reading | `workspace.getConfiguration` | `defineConfig`, `defineConfigs`, `defineConfigObject` |
| Status bar item | `window.createStatusBarItem` | `useStatusBarItem` |
| Output channel/logging | `window.createOutputChannel` | `useOutputChannel`, `useLogger`, `defineLogger` |
| Theme detection | `window.activeColorTheme` | `useActiveColorTheme`, `useIsDarkTheme` |
| Window state | `window.onDidChangeWindowState` | `useWindowState`, `useWindowFocused`, `useWindowActive` |
| File watching | `workspace.createFileSystemWatcher` | `useFsWatcher` |
| Active editor | `window.activeTextEditor` | `useActiveTextEditor` |
| Document content | `TextDocument.getText()` | `useDocumentText` |
| Terminal related | `window.activeTerminal`, `window.terminals` | `useActiveTerminal`, `useOpenedTerminals`, `useTerminalState` |
| TreeView | `window.createTreeView` | `useTreeView` |
| Webview Panel | `window.createWebviewPanel` | `useWebviewPanel` |
| Webview View | `window.registerWebviewViewProvider` | `useWebviewView` |
| View badge/title | - | `useViewBadge`, `useViewTitle` |
| View visibility | - | `useViewVisibility` |
| Debug session | `debug.activeDebugSession` | `useActiveDebugSession` |
| Comment controller | `comments.createCommentController` | `useCommentController` |
| Default shell | `env.shell` | `useDefaultShell` |
| Editor decorations | `window.createTextEditorDecorationType` | `useActiveEditorDecorations` |
| Resource management | `context.subscriptions.push` | `useDisposable` |
| VS Code context | `commands.executeCommand('setContext')` | `useVscodeContext` |
| Extension path | `context.asAbsolutePath` | `useAbsolutePath`, `asAbsolutePath` |
| File URI | `Uri.file` | `useFileUri` |
| Workspace folders | `workspace.workspaceFolders` | `useWorkspaceFolders` |
| All extensions | `extensions.all` | `useAllExtensions` |
| Extension secrets | `ExtensionContext.secrets` | `useExtensionSecret` |
| Chat participant | `chat.createChatParticipant` | `useChatParticipant` |

### Creating Reusable Logic

| Scenario | Recommended API |
|----------|-----------------|
| Extension entry | `defineExtension` |
| Service/reusable state | `defineService`, `createSingletonComposable` |
| Configuration definition | `defineConfig`, `defineConfigs`, `defineConfigObject` |

### Reactive APIs

`reactive-vscode` is based on Vue's reactivity system. The following APIs are available:

- `ref`, `computed`, `watch`, `watchEffect` - from `@reactive-vscode/reactivity`
- `reactive`, `readonly`, `shallowRef`, `shallowReactive` - standard Vue reactive APIs

### Lifecycle Hooks

- `onActivate` - when extension is activated
- `onDeactivate` - when extension is deactivated

---

## @reactive-vscode/vueuse API Usage Guidelines

This project also depends on `@reactive-vscode/vueuse`, which re-exports a subset of [VueUse](https://vueuse.org/) adapted for the VS Code extension environment. **Always prefer these utilities over manually implementing equivalent logic.**

Import from `@reactive-vscode/vueuse`:

```ts
import { useIntervalFn, watchArray, useToggle } from '@reactive-vscode/vueuse'
```

### Timing & Polling

| Need | Use | Instead of |
|------|-----|------------|
| Repeat a callback on an interval | `useIntervalFn(fn, ms, { immediateCallback: true })` | `setInterval` / `clearInterval` |
| One-shot delayed callback | `useTimeoutFn(fn, ms)` | `setTimeout` / `clearTimeout` |
| Polling with async callback | `useTimeoutPoll(fn, ms)` | manual `setTimeout` loop |
| Reactive elapsed counter | `useInterval(ms)` | — |
| Reactive current timestamp | `useTimestamp()` / `useNow()` | `Date.now()` in render |

> `useIntervalFn` returns `{ pause, resume, isActive }`. Pass `{ immediateCallback: true }` so `resume()` fires the callback immediately instead of waiting for the first interval.

### Watch Variants

| Need | Use | Instead of |
|------|-----|------------|
| Watch only newly-added array items | `watchArray(source, (newVal, oldVal, added, removed) => …)` | `watch` + manual diff |
| Run callback immediately on first watch | `watchImmediate` | `watch(…, { immediate: true })` |
| Watch only once | `watchOnce` | `watch` + `stop()` |
| Debounced watcher | `watchDebounced(source, fn, { debounce: ms })` | `watch` + manual debounce |
| Throttled watcher | `watchThrottled(source, fn, { throttle: ms })` | `watch` + manual throttle |
| Pause / resume a watcher | `watchPausable` | — |
| Ignore own-triggered updates | `watchIgnorable` | — |
| Deep watch shorthand | `watchDeep` | `watch(source, fn, { deep: true })` |

### Async & State

| Need | Use | Instead of |
|------|-----|------------|
| Async computed (loading + error states) | `computedAsync(async () => …, initialValue)` | `ref` + `watch` + try/catch |
| Async operation with state tracking | `useAsyncState(promise, initial)` | manual `ref` loading/error |
| Fetch with reactive URL | `useFetch(url)` | manual `fetch` in `watch` |
| Toggle boolean | `useToggle(false)` → `[state, toggle]` | `ref(false)` + inline toggle fn |
| Counter with inc/dec | `useCounter(0)` | `ref(0)` + inline helpers |
| Cycle through a list | `useCycleList(items)` | manual index tracking |
| Previous value of a ref | `usePrevious(source)` | manual `watch` + old-value ref |

### Array Utilities (Reactive)

When you need a derived reactive array, prefer these over `computed(() => arr.xxx(...))`:

```ts
import { useArrayFilter, useArrayMap, useArrayFind } from '@reactive-vscode/vueuse'

const active = useArrayFilter(accounts, (a) => !a.error)
const names  = useArrayMap(accounts, (a) => a.name)
```

Available: `useArrayFilter`, `useArrayMap`, `useArrayFind`, `useArrayFindIndex`,
`useArrayEvery`, `useArraySome`, `useArrayIncludes`, `useArrayDifference`,
`useArrayUnique`, `useArrayReduce`, `useArrayJoin`, `useSorted`.

### Ref History & Undo

| Need | Use |
|------|-----|
| Undo/redo for a ref | `useRefHistory(source)` or `useManualRefHistory(source)` |
| Debounced history snapshots | `useDebouncedRefHistory(source, { debounce: ms })` |
| Track last-changed timestamp | `useLastChanged(source)` |

### Other Commonly Useful Utils

| Utility | Purpose |
|---------|---------|
| `useEventBus(key)` | Typed in-process pub/sub between composables |
| `useThrottleFn` / `useDebounceFn` | Wrap any function |
| `useDateFormat(date, fmt)` | Reactive formatted date string |
| `useTimeAgo(date)` | Reactive "X minutes ago" string |
| `createSharedComposable(fn)` | Share a composable instance across callers (similar to `defineService`) |

> **Note:** Browser/DOM APIs in VueUse (e.g. `useLocalStorage`, `useMouse`, `useEventListener`) are **not available** in this package — it only re-exports environment-agnostic utilities.
