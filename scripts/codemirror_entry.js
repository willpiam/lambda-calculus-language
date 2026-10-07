// Re-export the editor surface used by website/app.js.
// Bundled by scripts/vendor_codemirror.sh into website/vendor/codemirror.js.
export { EditorState } from "@codemirror/state";
export {
  Decoration,
  EditorView,
  ViewPlugin,
  drawSelection,
  highlightActiveLine,
  keymap,
  lineNumbers,
} from "@codemirror/view";
export { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
