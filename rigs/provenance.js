// Field-level provenance sidecars for resolved rigs. Provenance is intentionally
// separate from paper-rig/1 data so existing consumers and golden rigs remain
// byte-identical. Target pointers use stable entity IDs for joints, plates, and
// anchors instead of fragile source-array indexes.

import { cloneData } from '@paper-rig/schema';

const SEMANTIC_ARRAYS = new Set(['joints', 'plates', 'anchors']);
const ENTITY_KINDS = {
  joint: 'joints',
  plate: 'plates',
  anchor: 'anchors',
  clip: 'clips',
};

const escapePointer = (value) => String(value).replaceAll('~', '~0').replaceAll('/', '~1');
const unescapePointer = (value) => String(value).replaceAll('~1', '/').replaceAll('~0', '~');
const pointer = (segments) => segments.length ? `/${segments.map(escapePointer).join('/')}` : '';
const pointerSegments = (value) => value.split('/').slice(1).map(unescapePointer);
const cloneValue = (value) => value === undefined ? null : cloneData(value);
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function flattenLeaves(value) {
  const leaves = new Map();
  function visit(current, segments) {
    if (current === null || typeof current !== 'object') {
      leaves.set(pointer(segments), cloneValue(current));
      return;
    }
    if (Array.isArray(current)) {
      if (!current.length) {
        leaves.set(pointer(segments), []);
        return;
      }
      const semantic = SEMANTIC_ARRAYS.has(segments.at(-1))
        && current.every((item) => item && typeof item === 'object' && typeof item.id === 'string');
      current.forEach((item, index) => visit(item, [...segments, semantic ? item.id : String(index)]));
      return;
    }
    const entries = Object.entries(current).filter(([, child]) => child !== undefined);
    if (!entries.length) {
      leaves.set(pointer(segments), {});
      return;
    }
    for (const [key, child] of entries) visit(child, [...segments, key]);
  }
  visit(value, []);
  return leaves;
}

function targetForPointer(targetPointer, resolvedModelId) {
  const segments = pointerSegments(targetPointer);
  const collection = segments[0];
  if (['joints', 'plates', 'anchors', 'clips'].includes(collection) && segments[1]) {
    return {
      kind: collection.slice(0, -1),
      id: segments[1],
      fieldPointer: pointer(segments.slice(2)),
    };
  }
  return {
    kind: 'rig',
    id: resolvedModelId,
    fieldPointer: targetPointer,
  };
}

export function createProvenanceTracker({ sourceModelId, familyId }) {
  const writes = [];
  let sequence = 0;

  function record(targetPointer, value, origin, resolvedModelId) {
    writes.push({
      sequence: sequence++,
      targetPointer,
      target: targetForPointer(targetPointer, resolvedModelId),
      origin: cloneValue(origin),
      value: cloneValue(value),
    });
  }

  return {
    recordInitial(rig) {
      for (const [targetPointer, value] of flattenLeaves(rig)) {
        record(targetPointer, value, {
          kind: 'family',
          operation: 'family.base',
          sourceId: familyId,
          sourcePointer: targetPointer,
        }, rig.id);
      }
    },

    recordTransition(before, after, descriptor) {
      const previous = flattenLeaves(before);
      for (const [targetPointer, value] of flattenLeaves(after)) {
        if (previous.has(targetPointer) && equal(previous.get(targetPointer), value)) continue;
        const origin = typeof descriptor.origin === 'function'
          ? descriptor.origin(targetPointer, value)
          : descriptor.origin;
        record(targetPointer, value, {
          operation: descriptor.operation,
          ...origin,
        }, after.id);
      }
    },

    finalize(rig) {
      const finalLeaves = flattenLeaves(rig);
      const retainedWrites = writes
        .filter((write) => finalLeaves.has(write.targetPointer))
        .map((write) => ({ ...write, target: targetForPointer(write.targetPointer, rig.id) }));
      const finalWriteByPointer = new Map();
      for (const write of retainedWrites) finalWriteByPointer.set(write.targetPointer, write);
      const finalOriginCounts = {};
      for (const write of finalWriteByPointer.values()) {
        finalOriginCounts[write.origin.kind] = (finalOriginCounts[write.origin.kind] || 0) + 1;
      }
      return {
        schema: 'paper-rig/provenance/1',
        schemaVersion: '1.0.0',
        sourceModelId,
        familyId,
        resolvedModelId: rig.id,
        summary: {
          leafCount: finalLeaves.size,
          writeCount: retainedWrites.length,
          unexplainedLeafCount: [...finalLeaves.keys()].filter((targetPointer) => !finalWriteByPointer.has(targetPointer)).length,
          finalOriginCounts,
        },
        writes: retainedWrites,
      };
    },
  };
}

function fieldPathToSegments(field = '') {
  return field
    .replaceAll(/\[([^\]]+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
}

export function provenanceSelectorPrefix(selector, resolvedModelId) {
  if (selector.startsWith('/')) return selector.replace(/\/$/, '');
  const separator = selector.indexOf('.');
  const entitySelector = separator < 0 ? selector : selector.slice(0, separator);
  const field = separator < 0 ? '' : selector.slice(separator + 1);
  const [kind, id] = entitySelector.split(':');
  if (kind === 'rig') return pointer(fieldPathToSegments(field));
  const collection = ENTITY_KINDS[kind];
  if (!collection || !id) throw new Error(`invalid entity selector ${selector}; use rig, joint:<id>, plate:<id>, anchor:<id>, clip:<id>, or a semantic /pointer`);
  return pointer([collection, id, ...fieldPathToSegments(field)]);
}

export function explainProvenance(provenance, selector) {
  const targetPrefix = provenanceSelectorPrefix(selector, provenance.resolvedModelId);
  const histories = new Map();
  for (const write of provenance.writes) {
    if (targetPrefix && write.targetPointer !== targetPrefix && !write.targetPointer.startsWith(`${targetPrefix}/`)) continue;
    const history = histories.get(write.targetPointer) || [];
    history.push(write);
    histories.set(write.targetPointer, history);
  }
  const fields = [...histories.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([targetPointer, history]) => {
    const finalWrite = history.at(-1);
    return {
      targetPointer,
      target: finalWrite.target,
      value: finalWrite.value,
      origin: finalWrite.origin,
      overwrittenWriteCount: history.length - 1,
      history: history.map((write) => ({
        sequence: write.sequence,
        origin: write.origin,
        value: write.value,
      })),
    };
  });
  return {
    schema: 'paper-rig/explanation/1',
    schemaVersion: '1.0.0',
    sourceModelId: provenance.sourceModelId,
    resolvedModelId: provenance.resolvedModelId,
    selector,
    targetPrefix,
    status: fields.length ? 'found' : 'not-found',
    summary: {
      fieldCount: fields.length,
      overwrittenFieldCount: fields.filter((field) => field.overwrittenWriteCount > 0).length,
    },
    fields,
  };
}
