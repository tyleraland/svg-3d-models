// Deterministic multi-view audit data and a self-contained human review artifact.
// The JSON report is the machine contract; HTML is a rendering of the same
// sampling manifest plus projected SVGs and never becomes an authoring source.

import { compilePackage, core, markup, projectScene } from '@paper-rig/compiler';
import { buildAuditOverlayEvidence, renderAuditOverlaySvg } from './audit-overlay.js';

export const DEFAULT_AUDIT_HEADINGS = [0, 45, 90, 135, 180, 225, 270, 315];
export const DEFAULT_AUDIT_ELEVATIONS = [45, 60, 75];
const EXPECTED_GROUPS = [
  'ground shadow',
  'camera-far appendages',
  'opaque core occluder',
  'core surface plates',
  'camera-near appendages',
  'paint/details/accessories',
];

const diagnostic = (code, pass, message, severity = 'error', entityIds = []) => ({
  code, severity, pass, message, entityIds,
});

function finiteDeep(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteDeep);
  if (value && typeof value === 'object') return Object.values(value).every(finiteDeep);
  return true;
}

function jointBounds(scene) {
  const xs = scene.joints.map((joint) => joint.screenPosition[0]);
  const ys = scene.joints.map((joint) => joint.screenPosition[1]);
  return {
    min: [Math.min(...xs), Math.min(...ys)],
    max: [Math.max(...xs), Math.max(...ys)],
  };
}

const inUnitInterval = (value) => Number.isFinite(value) && value >= 0 && value <= 1;
const vector3IsFinite = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const zeroVector = [0, 0, 0];

export function defaultAuditPoses(rig, pkg = compilePackage(rig)) {
  const poses = pkg.directionalBake.keyPoses.map((pose) => ({ ...pose }));
  const impactIndex = poses.findIndex((pose) => pose.clip === 'attack');
  if (impactIndex < 0) return poses;
  const attack = rig.clips.attack;
  const impactTime = poses[impactIndex].t;
  const releaseTime = (attack?.events || []).find((event) => event.t > impactTime && /release|recover|settle/i.test(event.name))?.t
    ?? impactTime + (1 - impactTime) * 0.6;
  poses.splice(impactIndex, 0, {
    id: 'attackAnticipation',
    clip: 'attack',
    t: impactTime * 0.45,
  });
  poses.splice(impactIndex + 2, 0, {
    id: 'attackRecovery',
    clip: 'attack',
    t: Math.min(1, releaseTime),
  });
  return poses;
}

function vectorEquivalent(a = zeroVector, b = zeroVector, rotations = false) {
  if (!vector3IsFinite(a) || !vector3IsFinite(b)) return false;
  return a.every((value, index) => {
    const delta = value - b[index];
    const distance = rotations ? Math.abs(((delta + 180) % 360 + 360) % 360 - 180) : Math.abs(delta);
    return distance <= 1e-9;
  });
}

function transformMapsEquivalent(a = {}, b = {}, rotations = false) {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...ids].every((id) => vectorEquivalent(a[id], b[id], rotations));
}

function frameEquivalent(a, b) {
  return transformMapsEquivalent(a?.poses, b?.poses)
    && transformMapsEquivalent(a?.rotations, b?.rotations, true);
}

function baseGraphConflicts(rig) {
  const clips = rig.clips || {};
  const ids = new Set(Object.keys(clips));
  const conflicts = new Set();
  for (const [id, clip] of Object.entries(clips)) {
    if (clip.base !== 'bind' && !ids.has(clip.base)) conflicts.add(id);
    const path = new Set([id]);
    let cursor = clip.base;
    while (cursor && cursor !== 'bind' && ids.has(cursor)) {
      if (path.has(cursor)) {
        for (const member of path) conflicts.add(member);
        break;
      }
      path.add(cursor);
      cursor = clips[cursor].base;
    }
  }
  return [...conflicts].sort();
}

export function motionDiagnostics(rig) {
  const jointIds = new Set(rig.joints.map((joint) => joint.id));
  const clipEntries = Object.entries(rig.clips || {});
  const badFrameOrder = [];
  const badEventOrder = [];
  const badContacts = [];
  const badTransforms = [];
  const openLoops = [];

  for (const [clipId, clip] of clipEntries) {
    const frames = clip.frames || [];
    if (!frames.length || frames.some((frame, index) => (
      !inUnitInterval(frame.t) || (index > 0 && frame.t <= frames[index - 1].t)
    ))) badFrameOrder.push(clipId);

    const events = clip.events || [];
    if (events.some((event, index) => (
      !inUnitInterval(event.t) || (index > 0 && event.t < events[index - 1].t)
    ))) badEventOrder.push(clipId);

    const intervals = clip.contactIntervals || [];
    if ((clip.contacts || []).some((id) => !jointIds.has(id)) || intervals.some((interval) => (
      !inUnitInterval(interval.from)
      || !inUnitInterval(interval.to)
      || interval.from > interval.to
      || !Array.isArray(interval.ids)
      || interval.ids.length === 0
      || interval.ids.some((id) => !jointIds.has(id))
    ))) badContacts.push(clipId);

    if (frames.some((frame) => [...Object.entries(frame.poses || {}), ...Object.entries(frame.rotations || {})]
      .some(([id, vector]) => !jointIds.has(id) || !vector3IsFinite(vector)))) badTransforms.push(clipId);

    if (clip.loop && frames.length && !frameEquivalent(frames[0], frames.at(-1))) openLoops.push(clipId);
  }

  const baseConflicts = baseGraphConflicts(rig);
  const attack = rig.clips?.attack;
  const jointById = new Map(rig.joints.map((joint) => [joint.id, joint]));
  const attackTargets = [...new Set((attack?.frames || []).flatMap((frame) => (
    [...Object.keys(frame.poses || {}), ...Object.keys(frame.rotations || {})]
  )))].sort();
  const attackCoreTargets = attackTargets.filter((id) => ['root', 'body'].includes(jointById.get(id)?.role));
  const rigidChildren = core.rigidSpanChildIds(rig);
  const legacyEndpointTargets = [...new Set(clipEntries.flatMap(([, clip]) => (clip.frames || []).flatMap((frame) => (
    Object.entries(frame.poses || {})
      .filter(([id, vector]) => rigidChildren.has(id) && vector3IsFinite(vector) && vector.some((value) => Math.abs(value) > 1e-12))
      .map(([id]) => id)
  ))))].sort();

  return [
    diagnostic('audit.clip-base-graph', baseConflicts.length === 0, baseConflicts.length ? `invalid or cyclic clip bases: ${baseConflicts.join(', ')}` : 'clip bases resolve and form an acyclic graph', 'error', baseConflicts),
    diagnostic('audit.keyframe-order', badFrameOrder.length === 0, badFrameOrder.length ? `clips require finite, strictly increasing normalized keyframe times: ${badFrameOrder.join(', ')}` : 'all clips have finite, strictly increasing normalized keyframe times', 'error', badFrameOrder),
    diagnostic('audit.event-order', badEventOrder.length === 0, badEventOrder.length ? `clips contain invalid or decreasing event times: ${badEventOrder.join(', ')}` : 'all clip events are normalized and ordered', 'error', badEventOrder),
    diagnostic('audit.contact-interval-contract', badContacts.length === 0, badContacts.length ? `clips contain invalid contact intervals or joint references: ${badContacts.join(', ')}` : 'all clip contacts resolve and use valid normalized intervals', 'error', badContacts),
    diagnostic('audit.finite-motion-transforms', badTransforms.length === 0, badTransforms.length ? `clips contain invalid joint transforms: ${badTransforms.join(', ')}` : 'all authored motion transforms are finite vectors targeting existing joints', 'error', badTransforms),
    diagnostic('audit.loop-closure', openLoops.length === 0, openLoops.length ? `looping clips do not return to an equivalent first frame: ${openLoops.join(', ')}` : 'all looping clips close without a transform discontinuity', 'error', openLoops),
    diagnostic('audit.attack-core-participation', !attack || attackCoreTargets.length > 0, !attack ? 'no attack clip to assess' : attackCoreTargets.length ? `attack includes core motion through ${attackCoreTargets.join(', ')}` : 'attack has no root/body controls; review whether whole-body anticipation and recovery would improve it', 'warning', attackTargets),
    diagnostic('audit.legacy-rigid-endpoint-controls', legacyEndpointTargets.length === 0, legacyEndpointTargets.length ? `legacy endpoint steering remains on rigid chains: ${legacyEndpointTargets.join(', ')}` : 'rigid chains are authored without endpoint translation controls', 'warning', legacyEndpointTargets),
  ];
}

export function auditRig(rig, options = {}) {
  const pkg = compilePackage(rig);
  const headings = [...(options.headings || DEFAULT_AUDIT_HEADINGS)];
  const elevations = [...(options.elevations || DEFAULT_AUDIT_ELEVATIONS)];
  const poses = (options.poses || defaultAuditPoses(rig, pkg)).map((pose) => ({ ...pose }));
  const views = [];

  for (const pose of poses) {
    for (const elevation of elevations) {
      for (const heading of headings) {
        const scene = projectScene(rig, {
          clip: pose.clip,
          time: pose.t,
          elevation,
          heading,
        });
        const elements = scene.compositingGroups.flatMap((group) => group.elements);
        const activeContactIds = pose.clip === 'bind' ? [...pkg.groundContacts] : core.contactIds(rig, pose.clip, pose.t);
        const overlay = buildAuditOverlayEvidence(rig, scene, activeContactIds);
        views.push({
          id: `${pose.id}@${elevation}@${heading}`,
          poseId: pose.id,
          clipId: pose.clip,
          timeNormalized: pose.t,
          elevationDegrees: elevation,
          headingDegrees: heading,
          finite: finiteDeep(scene),
          jointBounds: jointBounds(scene),
          elementCount: elements.length,
          generatedElementCount: elements.filter((element) => element.generated).length,
          activeContactIds,
          compositingGroups: scene.compositingGroups.map((group) => ({
            semanticRole: group.semanticRole,
            elementCount: group.elements.length,
          })),
          traceable: elements.every((element) => element.sourceId && element.sourceKind && element.vector?.attributes?.id === element.id),
          overlay,
        });
      }
    }
  }

  const expectedViewCount = poses.length * elevations.length * headings.length;
  const diagnostics = [
    ...pkg.validation.checks.map((check) => diagnostic(
      `rig.${check.id}`,
      check.pass,
      check.detail,
      check.severity || 'error',
      check.entityIds || [],
    )),
    ...pkg.validation.directionalChecks.map((check) => diagnostic(
      `directional.${check.id}`,
      check.pass,
      check.detail,
      check.severity || 'error',
      check.entityIds || [],
    )),
    diagnostic('audit.complete-sample-matrix', views.length === expectedViewCount, `${views.length}/${expectedViewCount} canonical views sampled`),
    diagnostic('audit.finite-projected-scenes', views.every((view) => view.finite), 'all sampled projected scenes contain finite numeric data'),
    diagnostic('audit.semantic-compositing-groups', views.every((view) => (
      JSON.stringify(view.compositingGroups.map((group) => group.semanticRole)) === JSON.stringify(EXPECTED_GROUPS)
    )), 'all sampled scenes contain the six ordered semantic compositing groups'),
    diagnostic('audit.source-traceability', views.every((view) => view.traceable), 'every sampled vector element resolves to a semantic source'),
    diagnostic('audit.overlay-evidence', views.every((view) => (
      view.overlay?.schema === 'paper-rig/audit-overlay/1'
      && view.overlay.plateLabels.every((label) => label.elementId && label.sourceId && finiteDeep(label))
      && view.overlay.contacts.every((contact) => contact.jointId && finiteDeep(contact))
      && view.overlay.anchors.every((anchor) => anchor.id && anchor.boneId && finiteDeep(anchor))
      && view.overlay.surfaceNormals.every((normal) => normal.sourceId && finiteDeep(normal))
    )), 'every sampled view contains finite plate/depth, compositing, and contact overlay evidence'),
    diagnostic('audit.rigid-span-policy', core.rigidPlateSpanLengthsPass(rig), 'every rigid span preserves bind length across every clip'),
    ...motionDiagnostics(rig),
  ];
  const issues = diagnostics.filter((item) => !item.pass && item.severity === 'error');
  const warnings = diagnostics.filter((item) => !item.pass && item.severity === 'warning');

  return {
    schema: 'paper-rig/audit/1',
    schemaVersion: '1.0.0',
    modelId: rig.id,
    status: issues.length ? 'failed' : 'passed',
    summary: {
      jointCount: rig.joints.length,
      plateCount: rig.plates.length,
      clipCount: Object.keys(rig.clips).length,
      viewCount: views.length,
      diagnosticCount: diagnostics.length,
      issueCount: issues.length,
      warningCount: warnings.length,
    },
    sampling: { headingsDegrees: headings, elevationsDegrees: elevations, poses },
    diagnostics,
    issues,
    warnings,
    views,
  };
}

export function auditCatalog(rigs, options = {}) {
  const entries = [...rigs]
    .map((entry) => entry?.rig ? entry : { sourceModelId: entry.id, rig: entry })
    .sort((a, b) => a.sourceModelId.localeCompare(b.sourceModelId));
  const models = entries.map(({ sourceModelId, rig }) => {
    const report = auditRig(rig, options);
    return {
      sourceModelId,
      modelId: report.modelId,
      status: report.status,
      summary: report.summary,
      diagnostics: report.diagnostics,
      issues: report.issues,
      warnings: report.warnings,
    };
  });
  const failedModels = models.filter((model) => model.status === 'failed');
  return {
    schema: 'paper-rig/audit-catalog/1',
    schemaVersion: '1.0.0',
    status: failedModels.length ? 'failed' : 'passed',
    summary: {
      modelCount: models.length,
      passedModelCount: models.length - failedModels.length,
      failedModelCount: failedModels.length,
      viewCount: models.reduce((total, model) => total + model.summary.viewCount, 0),
      diagnosticCount: models.reduce((total, model) => total + model.summary.diagnosticCount, 0),
      issueCount: models.reduce((total, model) => total + model.summary.issueCount, 0),
      warningCount: models.reduce((total, model) => total + model.summary.warningCount, 0),
    },
    models,
  };
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function renderManifestComparison(diff) {
  if (!diff) return '';
  if (!diff.compatible) {
    const reasons = diff.incompatibilities.map((item) => `<li><code>${escapeHtml(item.code)}</code> — ${escapeHtml(item.message)}</li>`).join('');
    return `<section class="manifestComparison incompatible"><h2>Approved manifest comparison</h2><p><strong>INCOMPATIBLE</strong> — the current audit cannot be compared safely with this manifest.</p><ul>${reasons}</ul></section>`;
  }
  const summary = diff.summary;
  const visibleChanges = diff.changes.slice(0, 64);
  const rows = visibleChanges.map((change) => {
    const ids = [...new Set([
      ...change.addedElementIds,
      ...change.removedElementIds,
      ...change.semanticChangedElementIds,
      ...change.projectionChangedElementIds,
      ...change.geometryChangedElementIds,
      ...change.compositingChangedElementIds,
      ...change.jointTransformChangedIds,
    ])];
    return `<tr><td><code>${escapeHtml(change.viewId)}</code></td><td>${escapeHtml(change.categories.join(', '))}</td><td>${escapeHtml(ids.join(', ') || 'contact set')}</td></tr>`;
  }).join('');
  const remainder = diff.changes.length > visibleChanges.length
    ? `<p>${diff.changes.length - visibleChanges.length} additional changed views are retained in the machine-readable report.</p>`
    : '';
  return `<section class="manifestComparison ${diff.status}"><h2>Approved manifest comparison</h2><p><strong>${diff.status.toUpperCase()}</strong> — ${summary.changedViewCount}/${summary.currentViewCount} views changed; ${summary.geometryChangeCount} vector, ${summary.compositingChangeCount} compositing, ${summary.jointTransformChangeCount} joint-transform, and ${summary.contactChangeCount} contact changes.</p>${rows ? `<table><thead><tr><td>View</td><td>Categories</td><td>Affected IDs</td></tr></thead><tbody>${rows}</tbody></table>` : ''}${remainder}</section>`;
}

export function renderAuditHtml(rig, report = auditRig(rig), options = {}) {
  const overlays = options.overlays ?? true;
  const viewById = new Map(report.views.map((view) => [view.id, view]));
  const changeByViewId = new Map((report.approvedManifestDiff?.changes || []).map((change) => [change.viewId, change]));
  const hasManifestChanges = report.approvedManifestDiff?.status === 'changed';
  const diagnostics = report.diagnostics.map((item) => {
    const state = item.pass ? 'pass' : item.severity === 'warning' ? 'warn' : 'fail';
    const label = item.pass ? 'PASS' : item.severity === 'warning' ? 'WARN' : 'FAIL';
    return `<tr class="${state}"><td>${label}</td><td><code>${escapeHtml(item.code)}</code></td><td>${escapeHtml(item.message)}</td></tr>`;
  }).join('');
  const sections = report.sampling.poses.map((pose) => {
    const rows = report.sampling.elevationsDegrees.map((elevation) => {
      const cells = report.sampling.headingsDegrees.map((heading) => {
        const viewId = `${pose.id}@${elevation}@${heading}`;
        const viewEvidence = viewById.get(viewId);
        const change = changeByViewId.get(viewId);
        const vector = markup(rig, {
          clip: pose.clip,
          time: pose.t,
          elevation,
          heading,
          bones: overlays,
          contacts: false,
          clean: !overlays,
        });
        let overlayMarkup = '';
        if (overlays) {
          const scene = projectScene(rig, { clip: pose.clip, time: pose.t, elevation, heading });
          const evidence = viewEvidence?.overlay || buildAuditOverlayEvidence(rig, scene, viewEvidence?.activeContactIds || []);
          const elementIds = change ? [...new Set([
            ...change.addedElementIds,
            ...change.semanticChangedElementIds,
            ...change.projectionChangedElementIds,
            ...change.geometryChangedElementIds,
            ...change.compositingChangedElementIds,
          ])] : [];
          overlayMarkup = renderAuditOverlaySvg(scene, evidence, {
            elementIds,
            jointIds: change?.jointTransformChangedIds || [],
            contactIds: change?.contactChanged ? [...new Set([...change.approvedContactIds, ...change.currentContactIds])] : [],
          });
        }
        const changed = change ? '<span class="viewChanged">changed</span>' : '';
        return `<figure class="${change ? 'changedView' : ''}" data-view-id="${escapeHtml(viewId)}"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${vector}${overlayMarkup}</svg><figcaption>${heading}° ${changed}</figcaption></figure>`;
      }).join('');
      return `<h3>elevation ${elevation}°</h3><div class="view-row">${cells}</div>`;
    }).join('');
    return `<section><h2>${escapeHtml(pose.id)} <small>${escapeHtml(pose.clip)} · t=${pose.t}</small></h2>${rows}</section>`;
  }).join('');
  const reportJson = JSON.stringify(report, null, 2).replaceAll('&', '\\u0026').replaceAll('<', '\\u003c');
  const manifestComparison = renderManifestComparison(report.approvedManifestDiff);
  const overlayControls = overlays ? `<nav class="overlayControls" aria-label="Diagnostic overlay controls"><strong>Overlays</strong><label><input type="checkbox" data-body-class="show-skeleton" checked>joints</label><label><input type="checkbox" data-body-class="show-contacts" checked>contacts</label><label><input type="checkbox" data-body-class="show-plates">plate IDs + depth</label><label><input type="checkbox" data-body-class="show-compositing">compositing tint</label><label><input type="checkbox" data-body-class="show-frames">anchors + normals</label>${hasManifestChanges ? '<label><input type="checkbox" data-body-class="show-changes" checked>manifest changes</label>' : ''}</nav>` : '';
  const bodyClasses = overlays ? `show-skeleton show-contacts${hasManifestChanges ? ' show-changes' : ''}` : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(rig.id)} paper-rig audit</title>
<style>
:root{color-scheme:dark}body{margin:20px;background:#24211d;color:#eee4cf;font:14px/1.4 system-ui,sans-serif}header{display:flex;align-items:end;justify-content:space-between;gap:20px}h1,h2,h3{margin:.5em 0}small{font-weight:400;opacity:.7}.status{padding:.35em .7em;border-radius:999px;background:${report.status === 'passed' ? '#285c43' : '#7d3434'};font-weight:700}table{width:100%;border-collapse:collapse;margin:16px 0 28px}td{padding:6px 8px;border-bottom:1px solid #494239}.pass td:first-child{color:#72d59b}.warn td:first-child{color:#f0c66f}.fail td:first-child{color:#ff8888}.manifestComparison{padding:1px 14px;border-left:4px solid #72d59b;background:#2b2823}.manifestComparison.changed{border-color:#f0c66f}.manifestComparison.incompatible{border-color:#ff8888}.overlayControls{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:9px 12px;background:#171512e8;border:1px solid #494239;border-radius:6px;backdrop-filter:blur(8px)}.overlayControls label{display:flex;align-items:center;gap:4px;font-size:12px}.view-row{display:grid;grid-template-columns:repeat(8,minmax(90px,1fr));gap:8px}figure{margin:0;text-align:center}.changedView svg{box-shadow:0 0 0 2px #ee5d5d}svg{display:block;width:100%;background:#f6f0e3;border-radius:5px}figcaption{font-size:11px;opacity:.7;margin-top:2px}.viewChanged{color:#ff8888;margin-left:4px}section{margin:32px 0}details{margin:30px 0}pre{overflow:auto;background:#171512;padding:12px;border-radius:6px}
.paperPlate{fill:#d7c39c;stroke:#39362e;stroke-width:1.2;vector-effect:non-scaling-stroke}.plateShade{fill:#b99d73}.paperPlate[data-palette-role="shadow"]{fill:#9d927d}.coreOccluderCell,.jointGasket{fill:#d7c39c;stroke:#d7c39c;stroke-width:1.5;vector-effect:non-scaling-stroke}.faceEye{fill:#fffdf7;stroke:#39362e;stroke-width:.8}.faceNose,.wingMembrane{fill:#b99d73;stroke:#39362e;stroke-width:.8;stroke-linejoin:round}.boneLine{stroke:#567084;stroke-width:.35}.jointDot{fill:#fff;stroke:#567084;stroke-width:.25}.labelText{fill:#28231d;font-size:2px}.contactRing{fill:none;stroke:#5d8e62;stroke-width:.55}
.auditGroup0{color:#6d747c}.auditGroup1{color:#357ca5}.auditGroup2{color:#7d55a6}.auditGroup3{color:#c77d1a}.auditGroup4{color:#d65332}.auditGroup5{color:#a83c82}.auditElementOutline{fill:currentColor!important;fill-opacity:.14;stroke:currentColor!important;stroke-width:.55;vector-effect:non-scaling-stroke}.auditPlateLeader{stroke:currentColor;stroke-width:.35;vector-effect:non-scaling-stroke}.auditPlateLabel,.auditContactLabel,.auditAnchorLabel,.auditChangedLabel{font:1.65px ui-monospace,monospace;paint-order:stroke;stroke:#f6f0e3;stroke-width:.7;stroke-linejoin:round}.auditPlateLabel{fill:currentColor}.auditContactRing{fill:none;stroke:#27864d;stroke-width:.75;vector-effect:non-scaling-stroke}.auditContactLabel{fill:#166b3a}.auditAnchorMark,.auditNormalLine{fill:none;stroke:#7652aa;stroke-width:.75;vector-effect:non-scaling-stroke}.auditAnchorLabel{fill:#62418e}.auditNormalTip{fill:#7652aa}.auditChangedElement{fill:none!important;stroke:#e32f2f!important;stroke-width:1.25;vector-effect:non-scaling-stroke}.auditChangedJoint{fill:#fff;stroke:#e32f2f;stroke-width:1;vector-effect:non-scaling-stroke}.auditChangedContact{fill:none;stroke:#e32f2f;stroke-width:1.2;stroke-dasharray:1.4 1;vector-effect:non-scaling-stroke}.auditChangedLabel{fill:#c51919;font-weight:700}.auditChangedOverlay{pointer-events:none}body:not(.show-skeleton) #skeletonOverlay,body:not(.show-contacts) .auditContactOverlay,body:not(.show-plates) .auditPlateDepthOverlay,body:not(.show-compositing) .auditCompositingOverlay,body:not(.show-frames) .auditFrameOverlay,body:not(.show-changes) .auditChangedOverlay{display:none}
</style></head><body class="${bodyClasses}"><header><div><h1>${escapeHtml(rig.id)} paper-rig audit</h1><div>${report.summary.viewCount} views · ${report.summary.jointCount} joints · ${report.summary.plateCount} plates · ${report.summary.clipCount} clips · ${report.summary.warningCount} warnings</div></div><div class="status">${report.status.toUpperCase()}</div></header>${overlayControls}<table><tbody>${diagnostics}</tbody></table>${manifestComparison}${sections}<details><summary>Machine-readable report</summary><pre>${escapeHtml(reportJson)}</pre></details><script>document.querySelectorAll('[data-body-class]').forEach(input=>input.addEventListener('change',()=>document.body.classList.toggle(input.dataset.bodyClass,input.checked)));</script></body></html>`;
}
