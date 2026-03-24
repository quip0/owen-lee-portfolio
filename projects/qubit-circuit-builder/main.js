/* ── Onboarding sequence ── */
(() => {
  const onboarding = document.getElementById("onboarding");
  if (!onboarding) return;

  const stages = [...onboarding.querySelectorAll(".onboarding__stage")];
  const progressBar = document.getElementById("onboarding-progress");
  const totalStages = stages.length;
  const stageDuration = [4500, 7000, 7000, 7000, 5000];
  const totalDuration = stageDuration.reduce((a, b) => a + b, 0);
  let current = 0;
  let timers = [];
  let startTime = Date.now();
  let progressRaf = null;
  let finished = false;

  /* add decorative wires */
  const wireContainer = document.createElement("div");
  wireContainer.className = "onboarding__wires";
  for (let i = 0; i < 5; i++) {
    const wire = document.createElement("div");
    wire.className = "onboarding__wire";
    wire.style.top = `${20 + i * 15}%`;
    wire.style.animationDelay = `${0.3 + i * 0.15}s`;
    wireContainer.appendChild(wire);
  }
  onboarding.prepend(wireContainer);

  /* add decorative gate nodes along the wires */
  for (let i = 0; i < 12; i++) {
    const node = document.createElement("div");
    node.className = "onboarding__gate-node";
    node.style.top = `${20 + Math.floor(i / 3) * 15}%`;
    node.style.left = `${15 + (i % 3) * 30 + Math.random() * 10}%`;
    node.style.animationDelay = `${1 + i * 0.3}s`;
    node.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    wireContainer.appendChild(node);
  }

  function showStage(index) {
    stages.forEach((s, i) => {
      s.classList.remove("onboarding__stage--active", "onboarding__stage--exit");
      if (i < index) s.classList.add("onboarding__stage--exit");
    });
    if (index < totalStages) {
      stages[index].classList.add("onboarding__stage--active");
    }
  }

  function updateProgress() {
    if (finished) return;
    const elapsed = Date.now() - startTime;
    const pct = Math.min((elapsed / totalDuration) * 100, 100);
    progressBar.style.width = pct + "%";
    progressRaf = requestAnimationFrame(updateProgress);
  }

  function scheduleStages() {
    let delay = 0;
    for (let i = 0; i < totalStages; i++) {
      const d = delay;
      timers.push(setTimeout(() => {
        current = i;
        showStage(i);
      }, d));
      delay += stageDuration[i];
    }
    /* finish after last stage */
    timers.push(setTimeout(finish, delay));
  }

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(progressRaf);
    progressBar.style.width = "100%";
    timers.forEach(clearTimeout);
    onboarding.classList.add("onboarding--done");
    setTimeout(() => {
      onboarding.remove();
    }, 900);
  }

  /* skip on Escape */
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      finish();
      document.removeEventListener("keydown", onKey);
    }
  }
  document.addEventListener("keydown", onKey);

  /* start */
  showStage(0);
  updateProgress();
  scheduleStages();
})();

const title = document.querySelector(".simple-page__title");
const codeEditors = [...document.querySelectorAll("[data-code-editor]")];
const codeShell = document.querySelector("[data-code-shell]");
const shellToggle = document.querySelector("[data-shell-toggle]");
const tabTriggers = [...document.querySelectorAll("[data-tab-trigger]")];
const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];
const qiskitInput = document.querySelector("#circuit-code");
const exampleButtons = [...document.querySelectorAll("[data-example]")];
const circuitCanvas = document.querySelector("[data-circuit-canvas]");
const circuitEmpty = document.querySelector("[data-circuit-empty]");
const circuitSummary = document.querySelector("[data-circuit-summary]");
const mathJaxScript = document.querySelector("script[data-mathjax]");
const measurementIconHref = new URL("./measurement icon.png", import.meta.url).href;
const svgNamespace = "http://www.w3.org/2000/svg";
const circuitPreviewState = {
  svg: null,
  intrinsicWidth: 0,
  intrinsicHeight: 0,
  baseScale: 1,
  zoomScale: 1,
  translateX: 0,
  translateY: 0,
  pointers: new Map(),
  dragPointerId: null,
  lastDragPoint: null,
  pinchGesture: null,
};
const mathJaxReady = new Promise((resolve) => {
  const finalize = () => {
    if (window.MathJax?.startup?.promise) {
      window.MathJax.startup.promise
        .then(() => resolve(window.MathJax))
        .catch(() => resolve(null));
      return;
    }

    resolve(null);
  };

  if (window.MathJax?.startup?.promise) {
    finalize();
    return;
  }

  if (!mathJaxScript) {
    resolve(null);
    return;
  }

  mathJaxScript.addEventListener("load", finalize, { once: true });
  mathJaxScript.addEventListener("error", () => resolve(null), { once: true });
});
const exampleCircuits = {
  teleportation: `from qiskit import QuantumCircuit

qc = QuantumCircuit(3, 3)

qc.h(1)
qc.cx(1, 2)

qc.h(0)
qc.p(0.37, 0)

qc.cx(0, 1)
qc.h(0)

qc.measure(0, 0)
qc.measure(1, 1)
qc.cx(1, 2)
qc.cz(0, 2)
qc.measure(2, 2)
`,
  "superdense-coding": `from qiskit import QuantumCircuit

qc = QuantumCircuit(2, 2)

qc.h(0)
qc.cx(0, 1)

qc.z(0)
qc.x(0)

qc.cx(0, 1)
qc.h(0)
qc.measure([0, 1], [0, 1])
`,
  "ghz-state": `from qiskit import QuantumCircuit

qc = QuantumCircuit(4, 4)

qc.h(0)
qc.cx(0, 1)
qc.cx(1, 2)
qc.cx(2, 3)
qc.barrier()
qc.measure([0, 1, 2, 3], [0, 1, 2, 3])
`,
  "phase-estimation": `from qiskit import QuantumCircuit
from qiskit.circuit import Parameter

theta = Parameter('θ')

qc = QuantumCircuit(3, 2)

qc.h(0)
qc.h(1)
qc.x(2)
qc.cp(theta, 1, 2)
qc.cp(theta / 2, 0, 2)
qc.barrier()
qc.h(1)
qc.cp(-3.14159 / 2, 0, 1)
qc.h(0)
qc.measure([0, 1], [0, 1])
`,
  "parameterized-cphase": `import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit.circuit import Parameter
from qiskit_aer import AerSimulator

theta = Parameter('θ')
phi = Parameter('Φ')

qc = QuantumCircuit(2)
qc.h(0)
qc.cp(theta, 0, 1)
qc.rx(phi, 0)
qc.x(1)
qc.measure_all()

backend = AerSimulator()
qc_transpiled = transpile(qc, backend)

print(qc_transpiled.draw())
`,
};
const refreshShellBodyHeight = () => {
  if (!codeShell || codeShell.dataset.collapsed === "true") {
    return;
  }

  const shellBody = codeShell.querySelector(".code-shell__body");

  if (shellBody) {
    shellBody.style.maxHeight = `${shellBody.scrollHeight}px`;
  }
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

if (title) {
  document.title = title.textContent || "Qubit Circuit Builder";
}

if (codeShell && shellToggle) {
  const shellBody = codeShell.querySelector(".code-shell__body");

  const setExpandedBodyHeight = () => {
    if (!shellBody || codeShell.dataset.collapsed === "true") {
      return;
    }

    shellBody.style.maxHeight = `${shellBody.scrollHeight}px`;
  };

  shellToggle.addEventListener("click", () => {
    if (!shellBody) {
      return;
    }

    const nextCollapsed = codeShell.dataset.collapsed !== "true";

    if (!nextCollapsed) {
      shellBody.hidden = false;
      shellBody.style.maxHeight = "0px";

      requestAnimationFrame(() => {
        shellBody.style.maxHeight = `${shellBody.scrollHeight}px`;
      });
    } else {
      shellBody.style.maxHeight = `${shellBody.scrollHeight}px`;

      requestAnimationFrame(() => {
        shellBody.style.maxHeight = "0px";
      });
    }

    codeShell.dataset.collapsed = String(nextCollapsed);
    shellToggle.setAttribute("aria-expanded", String(!nextCollapsed));
    shellToggle.textContent = nextCollapsed ? "Expand" : "Minimize";
  });

  if (shellBody) {
    shellBody.hidden = false;
    setExpandedBodyHeight();

    shellBody.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "max-height") {
        return;
      }

      const isCollapsed = codeShell.dataset.collapsed === "true";
      shellBody.hidden = isCollapsed;

      if (!isCollapsed) {
        shellBody.style.maxHeight = `${shellBody.scrollHeight}px`;
      }
    });

    window.addEventListener("resize", setExpandedBodyHeight);
  }
}

if (tabTriggers.length > 0 && tabPanels.length > 0) {
  const setActiveTab = (tabId, { focus = false } = {}) => {
    tabTriggers.forEach((trigger) => {
      const isActive = trigger.id === tabId;
      trigger.setAttribute("aria-selected", String(isActive));
      trigger.tabIndex = isActive ? 0 : -1;

      if (focus && isActive) {
        trigger.focus();
      }
    });

    tabPanels.forEach((panel) => {
      panel.hidden = panel.getAttribute("aria-labelledby") !== tabId;
    });

    if (codeShell?.dataset.collapsed !== "true") {
      const shellBody = codeShell?.querySelector(".code-shell__body");

      if (shellBody) {
        requestAnimationFrame(refreshShellBodyHeight);
      }
    }

  };

  const initialActiveTab =
    tabTriggers.find((trigger) => trigger.getAttribute("aria-selected") === "true")?.id ??
    tabTriggers[0].id;

  setActiveTab(initialActiveTab);

  tabTriggers.forEach((trigger, index) => {
    trigger.addEventListener("click", () => {
      setActiveTab(trigger.id);
      updateCircuitPreview();
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
        return;
      }

      event.preventDefault();

      let nextIndex = index;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabTriggers.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabTriggers.length) % tabTriggers.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabTriggers.length - 1;
      }

      setActiveTab(tabTriggers[nextIndex].id, { focus: true });
      updateCircuitPreview();
    });
  });
}

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const pythonKeywords = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);
const pythonBuiltins = new Set([
  "abs",
  "all",
  "any",
  "bool",
  "cls",
  "dict",
  "enumerate",
  "float",
  "int",
  "len",
  "list",
  "map",
  "max",
  "min",
  "print",
  "range",
  "self",
  "set",
  "str",
  "sum",
  "tuple",
  "zip",
]);
const blockStarters = /^(async\s+def|class|def|elif|else|except|finally|for|if|try|while|with)\b/;
const numberPattern = /^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i;
const openerToCloser = { "(": ")", "[": "]", "{": "}" };
const closerToOpener = { ")": "(", "]": "[", "}": "{" };

const addRange = (ranges, start, end) => {
  if (start >= end) {
    return;
  }

  ranges.push({ start, end });
};

const mergeRanges = (ranges) => {
  if (ranges.length < 2) {
    return ranges;
  }

  const ordered = [...ranges].sort((left, right) => left.start - right.start);
  const merged = [ordered[0]];

  for (const range of ordered.slice(1)) {
    const previous = merged[merged.length - 1];

    if (range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
      continue;
    }

    merged.push(range);
  }

  return merged;
};

const findDiagnostics = (source) => {
  const diagnosticsByLine = Array.from(
    { length: Math.max(source.split("\n").length, 1) },
    () => [],
  );
  const stack = [];
  const lines = source.split("\n");

  lines.forEach((line, lineIndex) => {
    if (line.includes("\t")) {
      let tabIndex = line.indexOf("\t");

      while (tabIndex !== -1) {
        addRange(diagnosticsByLine[lineIndex], tabIndex, tabIndex + 1);
        tabIndex = line.indexOf("\t", tabIndex + 1);
      }
    }

    const trimmedStart = line.trimStart();
    const indentWidth = line.length - trimmedStart.length;

    if (trimmedStart && indentWidth % 4 !== 0) {
      addRange(diagnosticsByLine[lineIndex], 0, indentWidth);
    }

    if (blockStarters.test(trimmedStart) && !trimmedStart.endsWith(":")) {
      addRange(diagnosticsByLine[lineIndex], trimmedStart.length - 1, trimmedStart.length);
    }

    let inString = false;
    let quote = "";
    let escaped = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === "\\") {
          escaped = true;
          continue;
        }

        if (char === quote) {
          inString = false;
          quote = "";
        }

        continue;
      }

      if (char === "#") {
        break;
      }

      if (char === "'" || char === '"') {
        inString = true;
        quote = char;
        continue;
      }

      if (openerToCloser[char]) {
        stack.push({ char, line: lineIndex, column: index });
        continue;
      }

      if (closerToOpener[char]) {
        const previous = stack[stack.length - 1];

        if (!previous || previous.char !== closerToOpener[char]) {
          addRange(diagnosticsByLine[lineIndex], index, index + 1);
          continue;
        }

        stack.pop();
      }
    }

    if (inString) {
      addRange(diagnosticsByLine[lineIndex], line.length - 1, line.length);
    }
  });

  stack.forEach(({ line, column }) => {
    addRange(diagnosticsByLine[line], column, column + 1);
  });

  return diagnosticsByLine.map(mergeRanges);
};

const classifyToken = (token, nextToken) => {
  if (token.startsWith("#")) {
    return "comment";
  }

  if (
    token.startsWith('"') ||
    token.startsWith("'") ||
    token.startsWith('"""') ||
    token.startsWith("'''")
  ) {
    return "string";
  }

  if (pythonKeywords.has(token)) {
    return "keyword";
  }

  if (pythonBuiltins.has(token)) {
    return "builtin";
  }

  if (numberPattern.test(token)) {
    return "number";
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token) && nextToken === "(") {
    return "function";
  }

  return "";
};

const renderSegment = (segment, tokenType, isError) => {
  const classes = [];

  if (tokenType) {
    classes.push(`token token--${tokenType}`);
  }

  if (isError) {
    classes.push("token token--error");
  }

  const content = escapeHtml(segment);
  return classes.length > 0 ? `<span class="${classes.join(" ")}">${content}</span>` : content;
};

const highlightLine = (line, diagnostics) => {
  const tokens = [];
  const pattern =
    /#.*$|"""|'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+(?:\.\d+)?(?:e[+-]?\d+)?|[A-Za-z_][A-Za-z0-9_]*|\s+|./g;

  let match = pattern.exec(line);

  while (match) {
    tokens.push({
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
    match = pattern.exec(line);
  }

  return tokens
    .map((token, index) => {
      const nextToken = tokens[index + 1]?.value ?? "";
      const tokenType = /^\s+$/.test(token.value) ? "" : classifyToken(token.value, nextToken);
      const overlapsError = diagnostics.some(
        (range) => token.start < range.end && token.end > range.start,
      );

      if (!overlapsError || /^\s+$/.test(token.value)) {
        return renderSegment(token.value, tokenType, overlapsError);
      }

      let html = "";
      let cursor = token.start;

      diagnostics.forEach((range) => {
        if (range.end <= token.start || range.start >= token.end) {
          return;
        }

        const safeStart = Math.max(range.start, token.start);
        const safeEnd = Math.min(range.end, token.end);

        if (safeStart > cursor) {
          html += renderSegment(line.slice(cursor, safeStart), tokenType, false);
        }

        html += renderSegment(line.slice(safeStart, safeEnd), tokenType, true);
        cursor = safeEnd;
      });

      if (cursor < token.end) {
        html += renderSegment(line.slice(cursor, token.end), tokenType, false);
      }

      return html;
    })
    .join("");
};

const highlightSource = (source) => {
  const lines = source.split("\n");
  const diagnostics = findDiagnostics(source);

  return lines
    .map((line, index) => highlightLine(line, diagnostics[index] ?? []))
    .join("\n");
};

const supportedSingleQubitGates = new Set([
  "h",
  "x",
  "y",
  "z",
  "s",
  "sdg",
  "t",
  "tdg",
  "id",
  "sx",
  "sxdg",
]);
const supportedParametricSingleQubitGates = new Set(["rx", "ry", "rz", "p", "u", "u1", "u2", "u3"]);
const supportedControlledGates = new Set(["cx", "cy", "cz", "ch", "cp", "cs", "csdg", "csx"]);
const supportedControlledParametricGates = new Set(["crx", "cry", "crz", "cu", "cu1", "cu3"]);

const stripInlineComment = (line) => {
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        inString = false;
        quote = "";
      }

      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "#") {
      return line.slice(0, index);
    }
  }

  return line;
};

const splitTopLevel = (value) => {
  const segments = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (const char of value) {
    if (inString) {
      current += char;

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        inString = false;
        quote = "";
      }

      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      current += char;
      continue;
    }

    if (char === "(" || char === "[" || char === "{") {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ")" || char === "]" || char === "}") {
      depth -= 1;
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      segments.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim() || value.endsWith(",")) {
    segments.push(current.trim());
  }

  return segments;
};

const parseIntegerLiteral = (value) => {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null;
};

const stripEnclosingQuotes = (value) => {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const buildParameterLabel = (value, parameterAliases) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return parameterAliases.get(trimmed) ?? trimmed;
};

const buildGateLabel = (gate, parameterArgs, parameterAliases) => {
  const params = parameterArgs
    .map((arg) => buildParameterLabel(arg, parameterAliases))
    .filter(Boolean);
  const upperGate = gate.toUpperCase();

  if (params.length === 0) {
    return upperGate;
  }

  if (upperGate === "CP") {
    return `P(${params[0]})`;
  }

  return `${upperGate}(${params.join(", ")})`;
};

const createAnonymousIndices = (count, start = 0) =>
  Array.from({ length: Math.max(count, 0) }, (_, index) => start + index);

const expandPairwiseTargets = (left, right) => {
  if (left.length === right.length) {
    return left.map((source, index) => [source, right[index]]);
  }

  if (left.length === 1) {
    return right.map((target) => [left[0], target]);
  }

  if (right.length === 1) {
    return left.map((source) => [source, right[0]]);
  }

  return [];
};

function resolveRegisterReference(value, kind, context) {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  const single = parseIntegerLiteral(trimmed);

  if (single !== null) {
    const limit = kind === "qubit" ? context.qubits : context.classicalBits;
    return single >= 0 && single < limit ? [single] : [];
  }

  const registerIndexMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(\d+)\]$/);

  if (registerIndexMatch) {
    const register = context.registers.get(registerIndexMatch[1]);
    const offset = Number.parseInt(registerIndexMatch[2], 10);

    if (!register || register.kind !== kind || offset >= register.count) {
      return [];
    }

    return [register.start + offset];
  }

  const directRegister = context.registers.get(trimmed);

  if (directRegister && directRegister.kind === kind) {
    return createAnonymousIndices(directRegister.count, directRegister.start);
  }

  const listMatch = trimmed.match(/^\[(.*)\]$/);

  if (!listMatch) {
    return [];
  }

  return splitTopLevel(listMatch[1]).flatMap((segment) => resolveRegisterReference(segment, kind, context));
}

const inferStageTargets = (args, context, kind) => {
  const targets = [];

  args.forEach((arg) => {
    const refs = resolveRegisterReference(arg, kind, context);

    if (refs.length > 0) {
      targets.push(...refs);
    }
  });

  return [...new Set(targets)];
};

const buildCircuitSummary = (circuit) => {
  const gateCount = circuit.ops.filter((op) => op.type !== "measure").length;
  const measurementCount = circuit.ops.filter((op) => op.type === "measure").length;
  const noun = circuit.qubits === 1 ? "qubit" : "qubits";
  const gateNoun = gateCount === 1 ? "gate" : "gates";
  const measurementNoun = measurementCount === 1 ? "measurement" : "measurements";

  return `${circuit.qubits} ${noun}, ${gateCount} ${gateNoun}, ${measurementCount} ${measurementNoun}`;
};

const normalizeCircuitContext = (baseQubits, baseClassicalBits, ops) => {
  let maxQubit = baseQubits - 1;
  let maxClassicalBit = baseClassicalBits - 1;

  ops.forEach((op) => {
    if (op.type === "single") {
      maxQubit = Math.max(maxQubit, op.target);
    } else if (op.type === "controlled") {
      maxQubit = Math.max(maxQubit, ...op.controls, op.target);
    } else if (op.type === "swap") {
      maxQubit = Math.max(maxQubit, op.left, op.right);
    } else if (op.type === "barrier" || op.type === "generic") {
      maxQubit = Math.max(maxQubit, ...op.targets);
    } else if (op.type === "measure") {
      maxQubit = Math.max(maxQubit, op.qubit);
      maxClassicalBit = Math.max(maxClassicalBit, op.bit);
    }
  });

  return {
    qubits: Math.max(baseQubits, maxQubit + 1, 1),
    classicalBits: Math.max(baseClassicalBits, maxClassicalBit + 1, 0),
    ops,
  };
};

const parseQiskitCircuit = (source) => {
  const lines = source.split("\n");
  let circuitName = "qc";
  let qubits = 0;
  let classicalBits = 0;
  let hasCircuit = false;
  const ops = [];
  const declaredRegisters = new Map();
  const activeRegisters = new Map();
  const circuitAliases = new Set();
  const parameterAliases = new Map();

  for (const rawLine of lines) {
    const line = stripInlineComment(rawLine).trim();

    if (!line) {
      continue;
    }

    const parameterMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*Parameter\((.*)\)$/);

    if (parameterMatch) {
      const parameterArgs = splitTopLevel(parameterMatch[2]);
      const displayName = stripEnclosingQuotes(parameterArgs[0] ?? parameterMatch[1]);
      parameterAliases.set(parameterMatch[1], displayName || parameterMatch[1]);
      continue;
    }

    const registerMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(QuantumRegister|ClassicalRegister)\((.*)\)$/);

    if (registerMatch) {
      const registerArgs = splitTopLevel(registerMatch[3]);
      const count = parseIntegerLiteral(registerArgs[0] ?? "");

      if (count !== null) {
        declaredRegisters.set(registerMatch[1], {
          kind: registerMatch[2] === "QuantumRegister" ? "qubit" : "classical",
          count,
        });
      }

      continue;
    }

    const initMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*QuantumCircuit\((.*)\)$/);

    if (initMatch) {
      const args = splitTopLevel(initMatch[2]);

      circuitName = initMatch[1];
      qubits = 0;
      classicalBits = 0;
      hasCircuit = true;
      activeRegisters.clear();
      circuitAliases.clear();
      circuitAliases.add(circuitName);

      args.forEach((arg) => {
        if (!arg || /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(arg)) {
          return;
        }

        const literalCount = parseIntegerLiteral(arg);

        if (literalCount !== null) {
          if (qubits === 0) {
            qubits = literalCount;
          } else {
            classicalBits = literalCount;
          }

          return;
        }

        const declaredRegister = declaredRegisters.get(arg);

        if (!declaredRegister) {
          return;
        }

        const start = declaredRegister.kind === "qubit" ? qubits : classicalBits;
        activeRegisters.set(arg, { ...declaredRegister, start });

        if (declaredRegister.kind === "qubit") {
          qubits += declaredRegister.count;
        } else {
          classicalBits += declaredRegister.count;
        }
      });

      continue;
    }

    const circuitAliasMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);

    if (hasCircuit && circuitAliasMatch) {
      const alias = circuitAliasMatch[1];
      const expression = circuitAliasMatch[2].trim();
      const directAliasMatch = expression.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
      const transpileAliasMatch = expression.match(/^transpile\(\s*([A-Za-z_][A-Za-z0-9_]*)\b.*\)$/);
      const derivedAliasMatch = expression.match(/^([A-Za-z_][A-Za-z0-9_]*)\.(copy|decompose|inverse)\((.*)\)$/);

      const sourceCircuit =
        directAliasMatch?.[1] ?? transpileAliasMatch?.[1] ?? derivedAliasMatch?.[1] ?? null;

      if (sourceCircuit && circuitAliases.has(sourceCircuit)) {
        circuitAliases.add(alias);
        continue;
      }
    }

    if (!hasCircuit) {
      continue;
    }

    const callMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\((.*)\)$/);

    if (!callMatch || !circuitAliases.has(callMatch[1])) {
      continue;
    }

    const gate = callMatch[2];
    const args = splitTopLevel(callMatch[3]);
    const context = { registers: activeRegisters, qubits, classicalBits };

    if (supportedSingleQubitGates.has(gate)) {
      const targets = resolveRegisterReference(args[0] ?? "", "qubit", context);
      targets.forEach((target) => {
        ops.push({ type: "single", gate, target });
      });
      continue;
    }

    if (supportedParametricSingleQubitGates.has(gate)) {
      const targets = resolveRegisterReference(args.at(-1) ?? "", "qubit", context);
      const parameterArgs = args.slice(0, -1);
      targets.forEach((target) => {
        ops.push({
          type: "single",
          gate,
          target,
          label: buildGateLabel(gate, parameterArgs, parameterAliases),
        });
      });
      continue;
    }

    if (supportedControlledGates.has(gate)) {
      const controlIndex = gate === "cp" ? 1 : 0;
      const targetIndex = gate === "cp" ? 2 : 1;
      const controls = resolveRegisterReference(args[controlIndex] ?? "", "qubit", context);
      const targets = resolveRegisterReference(args[targetIndex] ?? "", "qubit", context);
      const parameterArgs = gate === "cp" ? [args[0] ?? ""] : [];

      expandPairwiseTargets(controls, targets).forEach(([control, target]) => {
        ops.push({
          type: "controlled",
          gate,
          controls: [control],
          target,
          label: buildGateLabel(gate, parameterArgs, parameterAliases).replace(/^C/, ""),
        });
      });
      continue;
    }

    if (supportedControlledParametricGates.has(gate)) {
      const controls = resolveRegisterReference(args.at(-2) ?? "", "qubit", context);
      const targets = resolveRegisterReference(args.at(-1) ?? "", "qubit", context);
      const parameterArgs = args.slice(0, -2);
      const gateLabel = buildGateLabel(gate, parameterArgs, parameterAliases).replace(/^C/, "");

      expandPairwiseTargets(controls, targets).forEach(([control, target]) => {
        ops.push({
          type: "controlled",
          gate,
          controls: [control],
          target,
          label: gateLabel,
        });
      });
      continue;
    }

    if (gate === "ccx") {
      const firstControls = resolveRegisterReference(args[0] ?? "", "qubit", context);
      const secondControls = resolveRegisterReference(args[1] ?? "", "qubit", context);
      const targets = resolveRegisterReference(args[2] ?? "", "qubit", context);
      const controlPairs = expandPairwiseTargets(firstControls, secondControls);

      if (targets.length > 0) {
        controlPairs.forEach(([leftControl, rightControl], index) => {
          const target = targets[Math.min(index, targets.length - 1)];

          ops.push({
            type: "controlled",
            gate,
            controls: [leftControl, rightControl],
            target,
            label: "X",
          });
        });
      }

      continue;
    }

    if (gate === "swap") {
      const leftTargets = resolveRegisterReference(args[0] ?? "", "qubit", context);
      const rightTargets = resolveRegisterReference(args[1] ?? "", "qubit", context);

      expandPairwiseTargets(leftTargets, rightTargets).forEach(([left, right]) => {
        ops.push({ type: "swap", left, right });
      });
      continue;
    }

    if (gate === "barrier") {
      const targets = args.length === 0
        ? createAnonymousIndices(qubits)
        : inferStageTargets(args, context, "qubit");

      if (targets.length > 0) {
        ops.push({ type: "barrier", targets });
      }

      continue;
    }

    if (gate === "measure") {
      const measuredQubits = resolveRegisterReference(args[0] ?? "", "qubit", context);
      const classicalTargets = resolveRegisterReference(args[1] ?? "", "classical", context);

      expandPairwiseTargets(measuredQubits, classicalTargets).forEach(([qubit, bit]) => {
        ops.push({ type: "measure", qubit, bit });
      });

      continue;
    }

    if (gate === "measure_all") {
      createAnonymousIndices(Math.max(qubits, 1)).forEach((qubit) => {
        ops.push({ type: "measure", qubit, bit: qubit });
      });

      continue;
    }

    const genericTargets = inferStageTargets(args, context, "qubit");

    if (genericTargets.length > 0) {
      ops.push({
        type: "generic",
        gate,
        targets: genericTargets,
        label: gate.toUpperCase(),
      });
    }
  }

  return hasCircuit ? normalizeCircuitContext(qubits, classicalBits, ops) : null;
};

const escapeAttribute = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const escapeLatexText = (value) =>
  String(value).replaceAll(/([\\{}$&#^_%~])/g, "\\$1");

const latexSymbolMap = new Map([
  ["alpha", "\\alpha"],
  ["beta", "\\beta"],
  ["gamma", "\\gamma"],
  ["delta", "\\delta"],
  ["epsilon", "\\epsilon"],
  ["theta", "\\theta"],
  ["lambda", "\\lambda"],
  ["mu", "\\mu"],
  ["nu", "\\nu"],
  ["phi", "\\phi"],
  ["pi", "\\pi"],
  ["tau", "\\tau"],
  ["omega", "\\omega"],
  ["Alpha", "A"],
  ["Beta", "B"],
  ["Gamma", "\\Gamma"],
  ["Delta", "\\Delta"],
  ["Theta", "\\Theta"],
  ["Lambda", "\\Lambda"],
  ["Phi", "\\Phi"],
  ["Pi", "\\Pi"],
  ["Omega", "\\Omega"],
  ["θ", "\\theta"],
  ["Θ", "\\Theta"],
  ["ϕ", "\\phi"],
  ["φ", "\\phi"],
  ["Φ", "\\Phi"],
  ["π", "\\pi"],
  ["Π", "\\Pi"],
]);

const formatLatexExpression = (value) =>
  String(value)
    .replaceAll(/([A-Za-z\u0370-\u03FF]+|[θΘϕφΦπΠ])/g, (token) => latexSymbolMap.get(token) ?? token)
    .replaceAll("*", " \\cdot ")
    .replaceAll("/", " / ");

const buildLatexGateLabel = (label) => {
  const normalizedLabel = String(label).trim();
  const gateWithArgsMatch = normalizedLabel.match(/^([A-Za-z0-9]+)\((.*)\)$/);

  if (!gateWithArgsMatch) {
    return `\\mathrm{${escapeLatexText(normalizedLabel)}}`;
  }

  const gateName = escapeLatexText(gateWithArgsMatch[1]);
  const params = formatLatexExpression(gateWithArgsMatch[2].trim());

  return `\\mathrm{${gateName}}\\left(${params}\\right)`;
};

const renderLatexGateLabel = ({ x, y, label, fontSize, fill }) => {
  const safeLabel = escapeAttribute(label);
  const safeTex = escapeAttribute(buildLatexGateLabel(label));

  return [
    `<g class="circuit-gate-label" data-latex-label="true" data-tex="${safeTex}" data-x="${x}" data-y="${y}" data-font-size="${fontSize}" data-fill="${escapeAttribute(fill)}">`,
    `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="${escapeAttribute(fill)}" font-size="${fontSize}">${safeLabel}</text>`,
    `</g>`,
  ].join("");
};

const parseViewBox = (value) => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .map((part) => Number.parseFloat(part));

  return parts.length === 4 && parts.every((part) => Number.isFinite(part)) ? parts : null;
};

const renderLatexLabelsInPreview = async () => {
  const mathJax = await mathJaxReady;

  if (!mathJax || !circuitCanvas) {
    return;
  }

  const labelGroups = [...circuitCanvas.querySelectorAll("[data-latex-label='true']")];

  labelGroups.forEach((group) => {
    if (group.dataset.latexRendered === "true") {
      return;
    }

    const tex = group.dataset.tex ?? "";
    const x = Number.parseFloat(group.dataset.x ?? "0");
    const y = Number.parseFloat(group.dataset.y ?? "0");
    const fontSize = Number.parseFloat(group.dataset.fontSize ?? "12");
    const fill = group.dataset.fill ?? "currentColor";

    if (!tex) {
      return;
    }

    let rendered;

    try {
      rendered = mathJax.tex2svg(tex, { display: false });
    } catch {
      return;
    }

    const mathSvg = rendered.querySelector("svg");
    const viewBox = parseViewBox(mathSvg?.getAttribute("viewBox") ?? "");

    if (!mathSvg || !viewBox) {
      return;
    }

    const [minX, minY, width, height] = viewBox;
    const scale = (fontSize * 1.45) / Math.max(height, 1);
    const defs = [...mathSvg.querySelectorAll(":scope > defs")].map((node) => document.importNode(node, true));
    const children = [...mathSvg.childNodes]
      .filter((node) => node.nodeName.toLowerCase() !== "defs")
      .map((node) => document.importNode(node, true));
    const wrapper = document.createElementNS(svgNamespace, "g");

    wrapper.setAttribute(
      "transform",
      `translate(${x} ${y}) scale(${scale}) translate(${-minX - width / 2} ${-minY - height / 2})`,
    );

    children.forEach((node) => wrapper.appendChild(node));

    group.replaceChildren(...defs, wrapper);
    group.setAttribute("fill", fill);
    group.setAttribute("stroke", fill);
    group.style.color = fill;
    group.dataset.latexRendered = "true";
  });
};

const renderCircuitSvg = (circuit) => {
  const palette = {
    background: "rgba(255,255,255,0)",
    frame: "rgba(255,255,255,0.14)",
    wireLabel: "rgba(240,239,234,0.72)",
    classicalLabel: "rgba(240,239,234,0.5)",
    wire: "rgba(240,239,234,0.58)",
    classicalWire: "rgba(240,239,234,0.34)",
    stroke: "rgba(240,239,234,0.88)",
    gateFill: "#222220",
    gateFillStrong: "#2a2a28",
    gateText: "rgba(240,239,234,0.92)",
    barrier: "rgba(240,239,234,0.12)",
    measurementLink: "rgba(240,239,234,0.44)",
  };
  const rowGap = circuit.qubits > 10 ? 46 : circuit.qubits > 6 ? 54 : 72;
  const leftPad = 74;
  const topPad = 42;
  const rightPad = 32;
  const stageGap =
    circuit.ops.length > 36 ? 52 : circuit.ops.length > 24 ? 60 : circuit.ops.length > 12 ? 70 : 84;
  const gateSize =
    circuit.ops.length > 36 ? 32 : circuit.ops.length > 24 ? 36 : circuit.ops.length > 12 ? 40 : 44;
  const halfGate = gateSize / 2;
  const targetRadius = Math.max(12, Math.round(gateSize * 0.36));
  const controlRadius = Math.max(6, Math.round(gateSize * 0.18));
  const gateLabelSize = Math.max(11, Math.round(gateSize * 0.31));
  const compactStroke = circuit.ops.length > 24 ? 2.2 : 2.5;
  const stageCount = Math.max(circuit.ops.length, 1);
  const classicalGap = circuit.classicalBits > 0 ? Math.max(70, Math.round(rowGap * 1.2)) : 0;
  const qubitYs = Array.from({ length: circuit.qubits }, (_, index) => topPad + index * rowGap);
  const classicalStartY = topPad + (circuit.qubits - 1) * rowGap + classicalGap;
  const classicalYs = Array.from(
    { length: circuit.classicalBits },
    (_, index) => classicalStartY + index * Math.max(26, Math.round(rowGap * 0.44)),
  );
  const width = leftPad + rightPad + Math.max(stageCount - 1, 0) * stageGap + 96;
  const height = (classicalYs.at(-1) ?? qubitYs.at(-1) ?? topPad) + 50;
  const endX = width - rightPad;
  const stageX = (index) => leftPad + 54 + index * stageGap;
  const fragments = [
    `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="${palette.background}" stroke="${palette.frame}" stroke-width="1"/>`,
  ];

  qubitYs.forEach((y, index) => {
    fragments.push(
      `<text class="circuit-wire-label" x="18" y="${y + 5}" fill="${palette.wireLabel}" font-size="13">q${index}</text>`,
      `<line x1="${leftPad}" y1="${y}" x2="${endX}" y2="${y}" stroke="${palette.wire}" stroke-width="2"/>`,
    );
  });

  classicalYs.forEach((y, index) => {
    fragments.push(
      `<text class="circuit-classical-label" x="18" y="${y + 5}" fill="${palette.classicalLabel}" font-size="13">c${index}</text>`,
      `<line x1="${leftPad}" y1="${y}" x2="${endX}" y2="${y}" stroke="${palette.classicalWire}" stroke-width="2" stroke-dasharray="7 6"/>`,
    );
  });

  circuit.ops.forEach((op, index) => {
    const x = stageX(index);

    if (op.type === "single") {
      const y = qubitYs[op.target];
      const label = op.label ?? op.gate.toUpperCase();

      fragments.push(
        `<rect x="${x - halfGate}" y="${y - halfGate}" width="${gateSize}" height="${gateSize}" fill="${palette.gateFill}" stroke="${palette.stroke}" stroke-width="1.5"/>`,
        renderLatexGateLabel({ x, y, label, fontSize: gateLabelSize, fill: palette.gateText }),
      );
      return;
    }

    if (op.type === "controlled") {
      const controlYs = op.controls.map((control) => qubitYs[control]);
      const targetY = qubitYs[op.target];
      const topY = Math.min(...controlYs, targetY);
      const bottomY = Math.max(...controlYs, targetY);
      const label = op.label;

      fragments.push(`<line x1="${x}" y1="${topY}" x2="${x}" y2="${bottomY}" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`);

      controlYs.forEach((controlY) => {
        fragments.push(
          `<circle cx="${x}" cy="${controlY}" r="${controlRadius}" fill="${palette.stroke}" stroke="${palette.stroke}" stroke-width="1.5"/>`,
        );
      });

      if (op.gate === "cx") {
        fragments.push(
          `<circle cx="${x}" cy="${targetY}" r="${targetRadius}" fill="none" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`,
          `<line x1="${x}" y1="${targetY - Math.round(targetRadius * 0.7)}" x2="${x}" y2="${targetY + Math.round(targetRadius * 0.7)}" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`,
          `<line x1="${x - Math.round(targetRadius * 0.7)}" y1="${targetY}" x2="${x + Math.round(targetRadius * 0.7)}" y2="${targetY}" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`,
        );
        return;
      }

      fragments.push(
        `<rect x="${x - halfGate}" y="${targetY - halfGate}" width="${gateSize}" height="${gateSize}" fill="${palette.gateFillStrong}" stroke="${palette.stroke}" stroke-width="1.5"/>`,
        renderLatexGateLabel({
          x,
          y: targetY,
          label,
          fontSize: Math.max(10, gateLabelSize - 1),
          fill: palette.gateText,
        }),
      );
      return;
    }

    if (op.type === "generic") {
      const topY = qubitYs[Math.min(...op.targets)];
      const bottomY = qubitYs[Math.max(...op.targets)];
      const boxHeight = Math.max(bottomY - topY + 44, 44);
      const label = op.label;

      fragments.push(
        `<rect x="${x - 24}" y="${topY - 22}" width="48" height="${boxHeight}" fill="${palette.gateFillStrong}" stroke="${palette.stroke}" stroke-width="1.5"/>`,
        renderLatexGateLabel({
          x,
          y: topY - 22 + boxHeight / 2,
          label,
          fontSize: Math.max(10, gateLabelSize - 1),
          fill: palette.gateText,
        }),
      );
      return;
    }

    if (op.type === "swap") {
      const leftY = qubitYs[op.left];
      const rightY = qubitYs[op.right];
      const topY = Math.min(leftY, rightY);
      const bottomY = Math.max(leftY, rightY);

      fragments.push(
        `<line x1="${x}" y1="${topY}" x2="${x}" y2="${bottomY}" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`,
        `<line x1="${x - Math.round(gateSize * 0.25)}" y1="${leftY - Math.round(gateSize * 0.25)}" x2="${x + Math.round(gateSize * 0.25)}" y2="${leftY + Math.round(gateSize * 0.25)}" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`,
        `<line x1="${x - Math.round(gateSize * 0.25)}" y1="${leftY + Math.round(gateSize * 0.25)}" x2="${x + Math.round(gateSize * 0.25)}" y2="${leftY - Math.round(gateSize * 0.25)}" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`,
        `<line x1="${x - Math.round(gateSize * 0.25)}" y1="${rightY - Math.round(gateSize * 0.25)}" x2="${x + Math.round(gateSize * 0.25)}" y2="${rightY + Math.round(gateSize * 0.25)}" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`,
        `<line x1="${x - Math.round(gateSize * 0.25)}" y1="${rightY + Math.round(gateSize * 0.25)}" x2="${x + Math.round(gateSize * 0.25)}" y2="${rightY - Math.round(gateSize * 0.25)}" stroke="${palette.stroke}" stroke-width="${compactStroke}"/>`,
      );
      return;
    }

    if (op.type === "barrier") {
      const topY = qubitYs[Math.min(...op.targets)] - 22;
      const bottomY = qubitYs[Math.max(...op.targets)] + 22;

      fragments.push(
        `<line x1="${x - 8}" y1="${topY}" x2="${x - 8}" y2="${bottomY}" stroke="${palette.barrier}" stroke-width="3"/>`,
        `<line x1="${x + 8}" y1="${topY}" x2="${x + 8}" y2="${bottomY}" stroke="${palette.barrier}" stroke-width="3"/>`,
      );
      return;
    }

    if (op.type === "measure") {
      const qubitY = qubitYs[op.qubit];
      const classicalY = classicalYs[op.bit];
      const iconInset = Math.max(6, Math.round(gateSize * 0.14));
      const iconSize = gateSize - iconInset * 2;

      fragments.push(
        `<rect x="${x - halfGate}" y="${qubitY - halfGate}" width="${gateSize}" height="${gateSize}" fill="${palette.gateFillStrong}" stroke="${palette.stroke}" stroke-width="1.5"/>`,
        `<image x="${x - halfGate + iconInset}" y="${qubitY - halfGate + iconInset}" width="${iconSize}" height="${iconSize}" href="${escapeAttribute(measurementIconHref)}" preserveAspectRatio="xMidYMid meet" style="filter: brightness(0) invert(1);"/>`,
      );

      if (classicalY !== undefined) {
        fragments.push(
          `<path d="M ${x + 22} ${qubitY} L ${x + 34} ${qubitY} L ${x + 34} ${classicalY} L ${x + 12} ${classicalY}" fill="none" stroke="${palette.measurementLink}" stroke-width="2" stroke-dasharray="5 5"/>`,
          `<circle cx="${x + 12}" cy="${classicalY}" r="4" fill="${palette.stroke}"/>`,
        );
      }
    }
  });

  return `<svg class="circuit-preview__svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttribute(buildCircuitSummary(circuit))}" xmlns="http://www.w3.org/2000/svg">${fragments.join("")}</svg>`;
};

const getPreviewViewport = () => {
  if (!circuitCanvas) {
    return null;
  }

  return {
    width: circuitCanvas.clientWidth,
    height: circuitCanvas.clientHeight,
  };
};

const constrainPreviewTranslation = () => {
  const viewport = getPreviewViewport();

  if (!viewport || !circuitPreviewState.svg) {
    return;
  }

  const totalScale = circuitPreviewState.baseScale * circuitPreviewState.zoomScale;
  const scaledWidth = circuitPreviewState.intrinsicWidth * totalScale;
  const scaledHeight = circuitPreviewState.intrinsicHeight * totalScale;

  if (scaledWidth <= viewport.width) {
    circuitPreviewState.translateX = (viewport.width - scaledWidth) / 2;
  } else {
    circuitPreviewState.translateX = clamp(
      circuitPreviewState.translateX,
      viewport.width - scaledWidth,
      0,
    );
  }

  if (scaledHeight <= viewport.height) {
    circuitPreviewState.translateY = (viewport.height - scaledHeight) / 2;
  } else {
    circuitPreviewState.translateY = clamp(
      circuitPreviewState.translateY,
      viewport.height - scaledHeight,
      0,
    );
  }
};

const applyPreviewTransform = () => {
  if (!circuitPreviewState.svg) {
    return;
  }

  constrainPreviewTranslation();

  const totalScale = circuitPreviewState.baseScale * circuitPreviewState.zoomScale;
  circuitPreviewState.svg.style.transform = `translate(${circuitPreviewState.translateX}px, ${circuitPreviewState.translateY}px) scale(${totalScale})`;
};

const resetPreviewToFit = () => {
  const viewport = getPreviewViewport();

  if (!viewport || !circuitPreviewState.svg || viewport.width <= 0 || viewport.height <= 0) {
    return;
  }

  circuitPreviewState.baseScale = Math.min(
    viewport.width / circuitPreviewState.intrinsicWidth,
    viewport.height / circuitPreviewState.intrinsicHeight,
  );
  circuitPreviewState.zoomScale = 1;
  circuitPreviewState.translateX =
    (viewport.width - circuitPreviewState.intrinsicWidth * circuitPreviewState.baseScale) / 2;
  circuitPreviewState.translateY =
    (viewport.height - circuitPreviewState.intrinsicHeight * circuitPreviewState.baseScale) / 2;
  circuitPreviewState.pinchGesture = null;
  circuitPreviewState.dragPointerId = null;
  circuitPreviewState.lastDragPoint = null;
  applyPreviewTransform();
};

const updatePreviewScaleAroundPoint = (nextZoomScale, origin) => {
  if (!circuitPreviewState.svg) {
    return;
  }

  const previousTotalScale = circuitPreviewState.baseScale * circuitPreviewState.zoomScale;
  const nextClampedZoom = clamp(nextZoomScale, 1, 6);
  const nextTotalScale = circuitPreviewState.baseScale * nextClampedZoom;

  if (previousTotalScale <= 0 || nextTotalScale <= 0) {
    return;
  }

  circuitPreviewState.translateX =
    origin.x - ((origin.x - circuitPreviewState.translateX) / previousTotalScale) * nextTotalScale;
  circuitPreviewState.translateY =
    origin.y - ((origin.y - circuitPreviewState.translateY) / previousTotalScale) * nextTotalScale;
  circuitPreviewState.zoomScale = nextClampedZoom;
  applyPreviewTransform();
};

const getPointerMidpoint = (left, right) => ({
  x: (left.x + right.x) / 2,
  y: (left.y + right.y) / 2,
});

const getPointerDistance = (left, right) => Math.hypot(right.x - left.x, right.y - left.y);

const getPreviewPointFromEvent = (event) => {
  const bounds = circuitCanvas?.getBoundingClientRect();

  if (!bounds) {
    return { x: 0, y: 0 };
  }

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
};

const beginPinchGesture = () => {
  if (circuitPreviewState.pointers.size < 2) {
    circuitPreviewState.pinchGesture = null;
    return;
  }

  const [left, right] = [...circuitPreviewState.pointers.values()];

  circuitPreviewState.pinchGesture = {
    startDistance: Math.max(getPointerDistance(left, right), 1),
    startZoomScale: circuitPreviewState.zoomScale,
    startTranslateX: circuitPreviewState.translateX,
    startTranslateY: circuitPreviewState.translateY,
    midpoint: getPointerMidpoint(left, right),
  };
};

const attachCircuitPreviewInteractions = () => {
  if (!circuitCanvas || circuitCanvas.dataset.gesturesBound === "true") {
    return;
  }

  const clearPointer = (pointerId) => {
    circuitPreviewState.pointers.delete(pointerId);

    if (circuitPreviewState.dragPointerId === pointerId) {
      circuitPreviewState.dragPointerId = null;
      circuitPreviewState.lastDragPoint = null;
    }

    if (circuitPreviewState.pointers.size < 2) {
      circuitPreviewState.pinchGesture = null;
    }
  };

  circuitCanvas.addEventListener("pointerdown", (event) => {
    circuitCanvas.setPointerCapture(event.pointerId);
    const point = getPreviewPointFromEvent(event);
    circuitPreviewState.pointers.set(event.pointerId, point);

    if (circuitPreviewState.pointers.size === 1) {
      circuitPreviewState.dragPointerId = event.pointerId;
      circuitPreviewState.lastDragPoint = point;
    } else if (circuitPreviewState.pointers.size === 2) {
      circuitPreviewState.dragPointerId = null;
      circuitPreviewState.lastDragPoint = null;
      beginPinchGesture();
    }
  });

  circuitCanvas.addEventListener("pointermove", (event) => {
    if (!circuitPreviewState.pointers.has(event.pointerId) || !circuitPreviewState.svg) {
      return;
    }

    const point = getPreviewPointFromEvent(event);
    circuitPreviewState.pointers.set(event.pointerId, point);

    if (circuitPreviewState.pointers.size >= 2) {
      if (!circuitPreviewState.pinchGesture) {
        beginPinchGesture();
      }

      const [left, right] = [...circuitPreviewState.pointers.values()];
      const gesture = circuitPreviewState.pinchGesture;

      if (!gesture) {
        return;
      }

      const nextDistance = Math.max(getPointerDistance(left, right), 1);
      const nextZoomScale = gesture.startZoomScale * (nextDistance / gesture.startDistance);
      const previousZoomScale = circuitPreviewState.zoomScale;

      circuitPreviewState.translateX = gesture.startTranslateX;
      circuitPreviewState.translateY = gesture.startTranslateY;
      circuitPreviewState.zoomScale = gesture.startZoomScale;
      updatePreviewScaleAroundPoint(nextZoomScale, gesture.midpoint);

      if (previousZoomScale !== circuitPreviewState.zoomScale) {
        event.preventDefault();
      }

      return;
    }

    if (
      circuitPreviewState.dragPointerId !== event.pointerId ||
      !circuitPreviewState.lastDragPoint ||
      circuitPreviewState.zoomScale <= 1
    ) {
      return;
    }

    circuitPreviewState.translateX += point.x - circuitPreviewState.lastDragPoint.x;
    circuitPreviewState.translateY += point.y - circuitPreviewState.lastDragPoint.y;
    circuitPreviewState.lastDragPoint = point;
    applyPreviewTransform();
    event.preventDefault();
  });

  const endPointerInteraction = (event) => {
    clearPointer(event.pointerId);

    if (circuitPreviewState.pointers.size === 1) {
      const [pointerId, point] = circuitPreviewState.pointers.entries().next().value;
      circuitPreviewState.dragPointerId = pointerId;
      circuitPreviewState.lastDragPoint = point;
    }
  };

  circuitCanvas.addEventListener("pointerup", endPointerInteraction);
  circuitCanvas.addEventListener("pointercancel", endPointerInteraction);
  circuitCanvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch") {
      clearPointer(event.pointerId);
    }
  });

  circuitCanvas.dataset.gesturesBound = "true";
};

const syncCircuitPreviewViewport = () => {
  const svg = circuitCanvas?.querySelector(".circuit-preview__svg");

  circuitPreviewState.svg = svg ?? null;

  if (!svg) {
    return;
  }

  const viewBox = svg.viewBox.baseVal;
  circuitPreviewState.intrinsicWidth = viewBox.width;
  circuitPreviewState.intrinsicHeight = viewBox.height;
  svg.setAttribute("width", String(viewBox.width));
  svg.setAttribute("height", String(viewBox.height));
  resetPreviewToFit();
};

function updateCircuitPreview() {
  if (!circuitCanvas || !circuitEmpty || !circuitSummary) {
    return;
  }

  const circuit = parseQiskitCircuit(qiskitInput?.value ?? "");

  if (!circuit) {
    circuitCanvas.innerHTML = "";
    circuitPreviewState.svg = null;
    circuitEmpty.hidden = false;
    circuitEmpty.textContent = "Write readable Qiskit circuit code and the preview will infer the layout it can understand.";
    circuitSummary.textContent = "The renderer now infers circuit size from QuantumCircuit, register declarations, indexed qubits, register-wide gates, and readable gate calls.";
    return;
  }

  circuitCanvas.innerHTML = renderCircuitSvg(circuit);
  circuitEmpty.hidden = true;
  circuitEmpty.textContent = "";
  circuitSummary.textContent = `${buildCircuitSummary(circuit)}. Pinch to zoom.`;
  renderLatexLabelsInPreview();
  syncCircuitPreviewViewport();
}

const loadExampleCircuit = (name) => {
  if (!qiskitInput) {
    return;
  }

  const example = exampleCircuits[name];

  if (!example) {
    return;
  }

  qiskitInput.value = example;
  qiskitInput.dispatchEvent(new Event("input", { bubbles: true }));
  qiskitInput.focus();
};

codeEditors.forEach((editor) => {
  const codeInput = editor.querySelector("[data-code-input]");
  const lineNumbers = editor.querySelector("[data-line-numbers]");
  const codeHighlight = editor.querySelector("[data-code-highlight]");
  const codeHighlightSurface = codeHighlight?.closest(".code-editor__highlight");

  if (!codeInput || !lineNumbers || !codeHighlight || !codeHighlightSurface) {
    return;
  }

  const renderLineNumbers = () => {
    const lineCount = codeInput.value.split("\n").length;
    lineNumbers.textContent = Array.from(
      { length: Math.max(lineCount, 1) },
      (_, index) => `${index + 1}`,
    ).join("\n");
  };

  const renderHighlight = () => {
    const value = codeInput.value || " ";
    codeHighlight.innerHTML = highlightSource(value);
  };

  const syncScroll = () => {
    lineNumbers.scrollTop = codeInput.scrollTop;
    codeHighlightSurface.scrollTop = codeInput.scrollTop;
    codeHighlightSurface.scrollLeft = codeInput.scrollLeft;
  };

  renderLineNumbers();
  renderHighlight();
  syncScroll();

  codeInput.addEventListener("input", () => {
    renderLineNumbers();
    renderHighlight();
    refreshShellBodyHeight();
    syncScroll();

    if (codeInput === qiskitInput) {
      updateCircuitPreview();
    }
  });
  codeInput.addEventListener("scroll", syncScroll);
});

exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loadExampleCircuit(button.dataset.example ?? "");
  });
});

attachCircuitPreviewInteractions();
window.addEventListener("resize", () => {
  if (circuitPreviewState.svg) {
    resetPreviewToFit();
  }
});

updateCircuitPreview();
