// Minimal dependency-free flag parser. Recognizes `--flag value`, `--flag=value`,
// `-o value`, and bare positionals. Unknown flags are kept as-is.
export function parseArgs(argv, aliases = {}) {
  const positionals = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i];
    if (a.startsWith('--') || a.startsWith('-')) {
      let key = a.replace(/^--?/, '');
      let value;
      if (key.includes('=')) { [key, value] = key.split(/=(.*)/s); }
      key = aliases[key] || key;
      if (value === undefined) {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('-')) { value = next; i++; }
        else value = true; // boolean flag
      }
      flags[key] = value;
    } else {
      positionals.push(a);
    }
  }
  return { positionals, flags };
}
