import { LambdaTranspiler } from "./transpiler.js";
import { highlight } from "./highlight.js";
import {
  Decoration,
  EditorState,
  EditorView,
  ViewPlugin,
  defaultKeymap,
  drawSelection,
  highlightActiveLine,
  history,
  historyKeymap,
  keymap,
  lineNumbers,
} from "./vendor/codemirror.js";

const programMount = document.getElementById("program");
const programLabel = document.getElementById("program-label");
const runButton = document.getElementById("run-btn");
const downloadButton = document.getElementById("download-btn");
const fileInput = document.getElementById("file-input");
const output = document.getElementById("output");
const presetSelect = document.getElementById("preset-select");
let presets = [];
const DEFAULT_PRESET_ID = "prime-check";

const tokenMarks = new Map();

function tokenMark(kind) {
  let mark = tokenMarks.get(kind);
  if (!mark) {
    mark = Decoration.mark({ class: `tok-${kind}` });
    tokenMarks.set(kind, mark);
  }
  return mark;
}

function tokenDecorations(source) {
  const ranges = [];
  let last = 0;
  for (const token of highlight(source)) {
    if (token.end <= token.start || token.start < last || token.end > source.length) {
      continue;
    }
    ranges.push(tokenMark(token.kind).range(token.start, token.end));
    last = token.end;
  }
  return Decoration.set(ranges);
}

const tokenHighlight = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = tokenDecorations(view.state.doc.toString());
    }

    update(update) {
      if (update.docChanged) {
        this.decorations = tokenDecorations(update.state.doc.toString());
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);

const programView = new EditorView({
  parent: programMount,
  state: EditorState.create({
    doc: "",
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      tokenHighlight,
      EditorView.contentAttributes.of({
        "aria-labelledby": "program-label",
      }),
    ],
  }),
});

programLabel.addEventListener("click", () => {
  programView.focus();
});

function programText() {
  return programView.state.doc.toString();
}

function setProgramText(text) {
  programView.dispatch({
    changes: {
      from: 0,
      to: programView.state.doc.length,
      insert: text,
    },
  });
}

void initPresets();

runButton.addEventListener("click", async () => {
  const source = programText();
  const transpiler = new LambdaTranspiler({ coloredText: false });
  let generated = "";

  output.value = "building...";
  await waitForPaint();

  try {
    generated = transpiler.transpile(source);
  } catch (error) {
    output.value = `Failed while building: ${error.message}`;
    return;
  }

  output.value = "running...";
  await waitForPaint();

  try {
    const logs = [];

    const runtimeConsole = {
      log: (...args) => {
        logs.push(args.map(formatLogValue).join(" "));
      },
      error: (...args) => {
        logs.push(`Error: ${args.map(formatLogValue).join(" ")}`);
      },
      warn: (...args) => {
        logs.push(`Warning: ${args.map(formatLogValue).join(" ")}`);
      },
    };

    const runner = new Function("console", `"use strict";\n${generated}`);
    runner(runtimeConsole);

    const sections = [];
    sections.push("Execution complete.");
    if (logs.length > 0) {
      sections.push("\nProgram Output:\n" + logs.join("\n"));
    } else {
      sections.push("\nProgram Output:\n(no output)");
    }
    sections.push("\nGenerated JavaScript:\n" + generated);
    output.value = sections.join("\n");
  } catch (error) {
    output.value = `Failed while running: ${error.message}`;
  }
});

downloadButton.addEventListener("click", () => {
  const content = programText();
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "program.lc";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
});

fileInput.addEventListener("change", async (event) => {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    setProgramText(text);
    output.value = `Loaded ${file.name}`;
  } catch (error) {
    output.value = `Failed to load file: ${error.message}`;
  } finally {
    input.value = "";
  }
});

presetSelect.addEventListener("change", async () => {
  if (!presetSelect.value) {
    output.value = "Choose a preset.";
    return;
  }

  const selectedPreset = presets.find((preset) => preset.id === presetSelect.value);
  if (!selectedPreset) {
    output.value = "Could not find selected preset.";
    return;
  }

  await loadPreset(selectedPreset);
});

function formatLogValue(value) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "function") {
    return value.toString();
  }
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return String(value);
  }
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function initPresets() {
  try {
    const response = await fetch("presets.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.presets)) {
      throw new Error("Invalid presets format");
    }

    presets = data.presets.filter((preset) => isValidPreset(preset));

    if (presets.length === 0) {
      setPresetOptions([]);
      output.value = "No presets found in presets.json.";
      return;
    }

    setPresetOptions(presets);

    const defaultPreset = presets.find((preset) => preset.id === DEFAULT_PRESET_ID);
    if (defaultPreset) {
      presetSelect.value = defaultPreset.id;
      await loadPreset(defaultPreset);
    } else {
      output.value = "Presets ready.";
    }
  } catch (error) {
    setPresetOptions([]);
    output.value = `Preset loading disabled: ${error.message}`;
  }
}

function setPresetOptions(items) {
  presetSelect.innerHTML = "";

  if (items.length === 0) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "No presets available";
    presetSelect.appendChild(emptyOption);
    presetSelect.disabled = true;
    return;
  }

  const promptOption = document.createElement("option");
  promptOption.value = "";
  promptOption.textContent = "Select a preset";
  presetSelect.appendChild(promptOption);

  for (const preset of items) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.description
      ? `${preset.name} - ${preset.description}`
      : preset.name;
    presetSelect.appendChild(option);
  }

  presetSelect.disabled = false;
}

function isValidPreset(value) {
  return Boolean(
    value &&
      typeof value.id === "string" &&
      value.id.trim() &&
      typeof value.name === "string" &&
      value.name.trim() &&
      typeof value.file === "string" &&
      value.file.trim(),
  );
}

async function loadPreset(preset) {
  output.value = "loading preset...";

  try {
    const response = await fetch(preset.file);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const source = await response.text();
    setProgramText(source);
    output.value = `Loaded preset: ${preset.name}`;
  } catch (error) {
    output.value = `Failed to load preset: ${error.message}`;
  }
}
