// Regex-aware top-level statement scanner for the workbench script. Splits a
// classic-script body into top-level units (function declarations, const/let/var
// declarations, and bare statements), honoring strings, template literals, regex
// literals, and comments. Used by the one-time extraction scripts.

export function scan(body) {
  const N = body.length;
  const REGEX_PREV = new Set('(,=:[!&|?{;}+-*/%<>~^'.split(''));
  const lastSig = (i) => { let j = i - 1; while (j >= 0 && /\s/.test(body[j])) j--; return j; };
  function isRegexAt(i) {
    const j = lastSig(i); if (j < 0) return true;
    if (REGEX_PREV.has(body[j])) return true;
    let k = j; while (k >= 0 && /[A-Za-z]/.test(body[k])) k--;
    const w = body.slice(k + 1, j + 1);
    return ['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'do', 'else', 'case'].includes(w);
  }
  function skip(i) {
    const c = body[i];
    if (c === "'" || c === '"') { let j = i + 1; for (; j < N; j++) { if (body[j] === '\\') { j++; continue; } if (body[j] === c) return j + 1; } return j; }
    if (c === '`') { let j = i + 1; for (; j < N; j++) { if (body[j] === '\\') { j++; continue; } if (body[j] === '`') return j + 1; if (body[j] === '$' && body[j + 1] === '{') { j = matchBrace(j + 1) - 1; } } return j; }
    if (c === '/' && body[i + 1] === '/') { let j = i + 2; while (j < N && body[j] !== '\n') j++; return j; }
    if (c === '/' && body[i + 1] === '*') { let j = i + 2; while (j < N && !(body[j] === '*' && body[j + 1] === '/')) j++; return j + 2; }
    if (c === '/' && isRegexAt(i)) { let j = i + 1, cls = false; for (; j < N; j++) { const d = body[j]; if (d === '\\') { j++; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) { j++; break; } else if (d === '\n') break; } while (j < N && /[a-z]/.test(body[j])) j++; return j; }
    return i + 1;
  }
  const isSkippable = (i) => { const c = body[i]; return c === "'" || c === '"' || c === '`' || (c === '/' && (body[i + 1] === '/' || body[i + 1] === '*' || isRegexAt(i))); };
  function matchBrace(i) { let d = 0, j = i; while (j < N) { if (isSkippable(j)) { j = skip(j); continue; } if (body[j] === '{') d++; else if (body[j] === '}') { d--; if (d === 0) return j + 1; } j++; } return j; }
  function matchParen(i) { let d = 0, j = i; while (j < N) { if (isSkippable(j)) { j = skip(j); continue; } if (body[j] === '(') d++; else if (body[j] === ')') { d--; if (d === 0) return j + 1; } j++; } return j; }

  const units = [];
  let i = 0;
  while (i < N) {
    while (i < N && /\s/.test(body[i])) i++;
    if (i >= N) break;
    if (/^function[\s(]/.test(body.slice(i, i + 9))) {
      const nameM = /^function\s+([A-Za-z0-9_$]+)/.exec(body.slice(i, i + 120));
      const po = body.indexOf('(', i), pc = matchParen(po), bo = body.indexOf('{', pc), end = matchBrace(bo);
      units.push({ kind: 'function', name: nameM ? nameM[1] : '?', start: i, end });
      i = end; continue;
    }
    if (/^(const|let|var)[\s]/.test(body.slice(i, i + 6))) {
      let j = i, d = 0;
      while (j < N) { if (isSkippable(j)) { j = skip(j); continue; } const c = body[j]; if ('{(['.includes(c)) d++; else if ('})]'.includes(c)) d--; else if (c === ';' && d === 0) { j++; break; } j++; }
      units.push({ kind: 'decl', start: i, end: j });
      i = j; continue;
    }
    let j = i, d = 0;
    while (j < N) { if (isSkippable(j)) { j = skip(j); continue; } const c = body[j]; if ('{(['.includes(c)) d++; else if ('})]'.includes(c)) d--; else if (c === ';' && d === 0) { j++; break; } j++; }
    units.push({ kind: 'stmt', start: i, end: j });
    i = j;
  }
  const text = (idx) => body.slice(units[idx].start, units[idx].end);
  return { units, text };
}
