class LambdaTranspiler {
  constructor() {
    this.combinations = new Map();
  }

  transpile(program) {
    const { lines, comments } = this.parseLinesWithComments(program);
    const output = [];

    output.push(
      `// Compiled on ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })} from lambda calculus`,
    );

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (comments[i]) {
        output.push(comments[i].join("\n"));
      }

      if (
        line.includes(":=") && !line.startsWith("#") &&
        !line.startsWith("?") && !line.startsWith("@") && !line.startsWith("!") &&
        !line.startsWith("*")
      ) {
        const [name, expr] = line.split(":=").map((s) => s.trim());
        if (!/^[A-Z]/.test(name)) {
          throw new Error(`Combination '${name}' must start with a capital letter`);
        }
        const transpiledExpr = this.transpileExpression(expr);
        output.push(`const ${name} = ${transpiledExpr};`);
        this.combinations.set(name, transpiledExpr);
      } else if (line.startsWith("#")) {
        const expr = line.slice(1).trim();
        output.push(`console.log(toNumber(${this.transpileExpression(expr)}));`);
      } else if (line.startsWith("?")) {
        const expr = line.slice(1).trim();
        output.push(`console.log(toBoolean(${this.transpileExpression(expr)}));`);
      } else if (line.startsWith("@")) {
        const text = line.slice(1).trim();
        output.push(`console.log("${this.escapeForDoubleQuotedString(text)}");`);
      } else if (line.startsWith("!")) {
        const expr = line.slice(1).trim();
        output.push(`console.log((${this.transpileExpression(expr)}).toString());`);
      } else if (line.startsWith("*")) {
        const listExpr = this.transpileExpression(line.slice(1).trim());
        output.push(
          `(function(list) {
  const _isNil = (l) => {
    const testFn = (a) => (b) => ({ _cons: true, head: a, tail: b });
    const result = l(testFn);
    return !result._cons;
  };
  const _first = (p) => p((a) => (b) => a);
  const _second = (p) => p((a) => (b) => b);
  const arr = [];
  let current = list;
  while (!_isNil(current)) {
    arr.push(toNumber(_first(current)));
    current = _second(current);
  }
  console.log(arr);
})(${listExpr});`,
        );
      } else if (
        line && !line.includes(":=") && !line.startsWith("#") &&
        !line.startsWith("?") && !line.startsWith("@") && !line.startsWith("!") &&
        !line.startsWith("*")
      ) {
        output.push(this.transpileExpression(line));
      }
    }

    const fullOutput = [];
    let definitionsDone = false;

    for (const line of output) {
      if (!definitionsDone && !line.includes("const") && !line.startsWith("//")) {
        fullOutput.push(this.toNumberFunction());
        fullOutput.push(this.toBooleanFunction());
        definitionsDone = true;
      }
      fullOutput.push(line);
    }

    if (!definitionsDone) {
      fullOutput.push(this.toNumberFunction());
      fullOutput.push(this.toBooleanFunction());
    }

    return fullOutput.join("\n").trim();
  }

  parseLinesWithComments(program) {
    const lines = [];
    const comments = [];
    let currentComments = [];
    let buffer = "";

    const addLine = () => {
      if (buffer.trim()) {
        lines.push(buffer.trim());
        comments.push(currentComments.length ? currentComments : null);
        currentComments = [];
      } else if (currentComments.length) {
        lines.push("");
        comments.push(currentComments);
        currentComments = [];
      }
      buffer = "";
    };

    for (let i = 0; i < program.length; i += 1) {
      if (program[i] === "/" && i + 1 < program.length && program[i + 1] === "/") {
        addLine();
        buffer = "";
        i += 2;
        while (i < program.length && program[i] !== "\n") {
          buffer += program[i];
          i += 1;
        }
        currentComments.push(`//${buffer}`);
        buffer = "";
      } else if (program[i] === "\n") {
        addLine();
      } else {
        buffer += program[i];
      }
    }

    addLine();
    return { lines, comments };
  }

  parseExpression(expr) {
    if (!expr || typeof expr !== "string") {
      throw new Error("Invalid expression: expression must be a non-empty string");
    }
    expr = expr.trim();

    if (!expr.startsWith("$")) {
      return this.transpileExpression(expr);
    }

    const parts = expr.slice(1).split(".");
    if (parts.length < 2) {
      throw new Error(`Malformed lambda expression: ${expr}`);
    }

    const params = [];
    let bodyIndex = 0;
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (/^[a-z]+$/.test(parts[i])) {
        params.push(parts[i]);
        bodyIndex = i + 1;
      } else {
        break;
      }
    }

    const body = parts.slice(bodyIndex).join(".").trim();
    if (params.length === 0) {
      throw new Error(`No valid parameters in lambda expression: ${expr}`);
    }

    const allParams = [];
    params.forEach((param) => {
      if (param.length > 1) {
        allParams.push(...param.split(""));
      } else {
        allParams.push(param);
      }
    });

    let result = this.transpileApplication(body);
    for (let i = allParams.length - 1; i >= 0; i -= 1) {
      const param = allParams[i];
      if (!/^[a-z]$/.test(param)) {
        throw new Error(`Parameter '${param}' must be a single lowercase letter`);
      }
      result = `(${param}) => ${result}`;
    }

    return result;
  }

  transpileApplication(body) {
    const tokens = this.tokenize(body);
    if (tokens.length === 1) {
      if (tokens[0].startsWith("$")) {
        return this.parseExpression(tokens[0]);
      }
      if (tokens[0].startsWith("(") && tokens[0].endsWith(")")) {
        return this.transpileExpression(tokens[0].slice(1, -1).trim());
      }
      return tokens[0];
    }

    let result = "";
    for (let i = 0; i < tokens.length; i += 1) {
      let token = tokens[i];
      if (token.startsWith("$")) {
        token = this.parseExpression(token);
      } else if (token.startsWith("(") && token.endsWith(")")) {
        token = this.transpileExpression(token.slice(1, -1).trim());
      }

      if (token.includes("=>") && !/^\(.*\)=>/.test(token.trim())) {
        token = `(${token})`;
      }

      if (i === 0) {
        result = token;
      } else {
        result = `${result}(${token})`;
      }
    }

    return result;
  }

  transpileExpression(expr) {
    if (!expr || typeof expr !== "string") {
      throw new Error("Invalid expression: expression must be a non-empty string");
    }
    expr = expr.trim();

    if (expr.startsWith("$")) {
      return this.parseExpression(expr);
    }

    if (expr.startsWith("(") && expr.endsWith(")")) {
      const innerExpr = expr.slice(1, -1).trim();
      if (innerExpr.startsWith("$")) {
        return this.parseExpression(innerExpr);
      }
      return this.transpileExpression(innerExpr);
    }

    const tokens = this.tokenize(expr);
    if (tokens.length === 0) {
      throw new Error(`Empty expression: ${expr}`);
    }

    let result = tokens[0];
    if (result.startsWith("(") && result.endsWith(")")) {
      const inner = result.slice(1, -1).trim();
      result = inner.startsWith("$")
        ? this.parseExpression(inner)
        : this.transpileExpression(inner);
    } else if (result.startsWith("$")) {
      result = this.parseExpression(result);
    } else if (!/^[a-z]$/.test(result) && !this.combinations.has(result)) {
      throw new Error(`Unknown combination or invalid variable '${result}'`);
    }

    for (let i = 1; i < tokens.length; i += 1) {
      let arg = tokens[i];
      if (arg.startsWith("(") && arg.endsWith(")")) {
        const innerArg = arg.slice(1, -1).trim();
        arg = innerArg.startsWith("$")
          ? this.parseExpression(innerArg)
          : this.transpileExpression(innerArg);
      } else if (arg.startsWith("$")) {
        arg = this.parseExpression(arg);
      } else if (!/^[a-z]$/.test(arg) && !this.combinations.has(arg)) {
        throw new Error(`Invalid argument '${arg}'`);
      }
      result = `${result}(${arg})`;
    }

    return result;
  }

  tokenize(expr) {
    const tokens = [];
    let currentToken = "";
    let parenDepth = 0;

    for (let i = 0; i < expr.length; i += 1) {
      const char = expr[i];
      if (char === "(") {
        parenDepth += 1;
        currentToken += char;
      } else if (char === ")") {
        parenDepth -= 1;
        currentToken += char;
        if (parenDepth === 0 && currentToken) {
          tokens.push(currentToken);
          currentToken = "";
        } else if (parenDepth < 0) {
          throw new Error(`Unmatched closing parenthesis in '${expr}'`);
        }
      } else if (char === " " && parenDepth === 0) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = "";
        }
      } else {
        currentToken += char;
      }
    }

    if (currentToken) {
      tokens.push(currentToken);
    }
    if (parenDepth > 0) {
      throw new Error(`Unmatched opening parenthesis in '${expr}'`);
    }

    return tokens.filter(Boolean);
  }

  toNumberFunction() {
    return `
function toNumber(church) {
  return church((n) => n + 1)(0);
}
`;
  }

  toBooleanFunction() {
    return `
function toBoolean(church) {
  return church("True")("False");
}
`;
  }

  escapeForDoubleQuotedString(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  }
}

const programArea = document.getElementById("program");
const runButton = document.getElementById("run-btn");
const downloadButton = document.getElementById("download-btn");
const fileInput = document.getElementById("file-input");
const output = document.getElementById("output");
const presetSelect = document.getElementById("preset-select");
const loadPresetButton = document.getElementById("load-preset-btn");

const starterProgram = `// minimal starter program
Idiot := $a.a
One := $fa.f a

@show one
#One
`;

programArea.value = starterProgram;
let presets = [];

void initPresets();

runButton.addEventListener("click", async () => {
  const source = programArea.value;
  const transpiler = new LambdaTranspiler();
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
  const content = programArea.value;
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
    programArea.value = text;
    output.value = `Loaded ${file.name}`;
  } catch (error) {
    output.value = `Failed to load file: ${error.message}`;
  } finally {
    input.value = "";
  }
});

loadPresetButton.addEventListener("click", async () => {
  if (!presetSelect.value) {
    output.value = "Choose a preset first.";
    return;
  }

  const selectedPreset = presets.find((preset) => preset.id === presetSelect.value);
  if (!selectedPreset) {
    output.value = "Could not find selected preset.";
    return;
  }

  output.value = "loading preset...";

  try {
    const response = await fetch(selectedPreset.file);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const source = await response.text();
    programArea.value = source;
    output.value = `Loaded preset: ${selectedPreset.name}`;
  } catch (error) {
    output.value = `Failed to load preset: ${error.message}`;
  }
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
    output.value = "Presets ready.";
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
    loadPresetButton.disabled = true;
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
  loadPresetButton.disabled = false;
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
