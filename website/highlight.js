// Lexical colors for the playground. This does not parse or validate programs.
export function highlight(source) {
  if (typeof source !== "string" || source.length === 0) {
    return [];
  }

  const tokens = [];
  let i = 0;
  let lineStart = true;

  const push = (start, end, kind) => {
    if (end > start) {
      tokens.push({ start, end, kind });
    }
  };

  while (i < source.length) {
    const ch = source[i];

    if (isLineBreak(ch)) {
      i = skipLineBreak(source, i);
      lineStart = true;
      continue;
    }

    if (isSpace(ch)) {
      i++;
      continue;
    }

    if (ch === "/" && source[i + 1] === "/") {
      const start = i;
      i += 2;
      while (i < source.length && !isLineBreak(source[i])) {
        i++;
      }
      push(start, i, "comment");
      lineStart = false;
      continue;
    }

    if (lineStart && isDirective(ch)) {
      push(i, i + 1, "directive");
      i++;
      lineStart = false;
      if (ch === "@") {
        const start = i;
        while (i < source.length && !isLineBreak(source[i])) {
          if (source[i] === "/" && source[i + 1] === "/") {
            break;
          }
          i++;
        }
        push(start, i, "text");
      }
      continue;
    }

    if (lineStart) {
      const afterDefine = tryDefinition(source, i, push);
      if (afterDefine !== null) {
        i = afterDefine;
        lineStart = false;
        continue;
      }
    }

    lineStart = false;
    i = scanExpression(source, i, push);
  }

  return tokens;
}

function tryDefinition(source, i, push) {
  if (!isUpper(source[i])) {
    return null;
  }

  let nameEnd = i + 1;
  while (nameEnd < source.length && isIdentChar(source[nameEnd])) {
    nameEnd++;
  }

  let cursor = nameEnd;
  while (cursor < source.length && isSpace(source[cursor])) {
    cursor++;
  }

  if (source[cursor] !== ":" || source[cursor + 1] !== "=") {
    return null;
  }

  push(i, nameEnd, "defName");
  push(cursor, cursor + 2, "define");
  return cursor + 2;
}

function scanExpression(source, i, push) {
  const ch = source[i];

  if (ch === "(" || ch === ")") {
    push(i, i + 1, "paren");
    return i + 1;
  }

  if (ch === "$") {
    push(i, i + 1, "lambda");
    i++;
    if (i < source.length && isLower(source[i])) {
      const start = i;
      while (i < source.length && isLower(source[i])) {
        i++;
      }
      push(start, i, "param");
      if (i < source.length && source[i] === ".") {
        push(i, i + 1, "dot");
        i++;
      }
    }
    return i;
  }

  if (isLower(ch)) {
    let end = i + 1;
    while (end < source.length && isIdentChar(source[end])) {
      end++;
    }
    push(i, end, end === i + 1 ? "variable" : "invalid");
    return end;
  }

  if (isUpper(ch)) {
    let end = i + 1;
    while (end < source.length && isIdentChar(source[end])) {
      end++;
    }
    push(i, end, "name");
    return end;
  }

  const start = i;
  i++;
  while (i < source.length && !isExpressionBoundary(source, i)) {
    i++;
  }
  push(start, i, "invalid");
  return i;
}

function isExpressionBoundary(source, i) {
  const ch = source[i];
  if (isSpace(ch) || isLineBreak(ch)) {
    return true;
  }
  if (ch === "(" || ch === ")" || ch === "$") {
    return true;
  }
  if (isUpper(ch) || isLower(ch)) {
    return true;
  }
  return ch === "/" && source[i + 1] === "/";
}

function isDirective(ch) {
  return ch === "#" || ch === "?" || ch === "!" || ch === "*" || ch === "@";
}

function isLineBreak(ch) {
  return ch === "\n" || ch === "\r";
}

function skipLineBreak(source, i) {
  if (source[i] === "\r" && source[i + 1] === "\n") {
    return i + 2;
  }
  return i + 1;
}

function isSpace(ch) {
  return ch === " " || ch === "\t";
}

function isUpper(ch) {
  return ch >= "A" && ch <= "Z";
}

function isLower(ch) {
  return ch >= "a" && ch <= "z";
}

function isIdentChar(ch) {
  return isUpper(ch) || isLower(ch) || (ch >= "0" && ch <= "9") || ch === "_";
}
