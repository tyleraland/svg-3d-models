import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '@paper-rig/rigs';
import { markup, core, useRig } from '@paper-rig/compiler';

const rabbit = loadModel('rabbit');
test('joint labels and skeleton render independently and stay out of clean exports', () => {
  for (const bones of [false, true]) for (const labels of [false, true]) {
    const svg = markup(rabbit, { clean: false, bones, labels });
    assert.equal(svg.includes('class="labelText"'), labels);
    assert.equal(svg.includes('class="boneLine"'), bones);
    assert.equal(svg.includes('class="jointDot"'), bones);
    assert.doesNotMatch(markup(rabbit, { clean: true, bones, labels }), /labelText|boneLine|jointDot/);
  }
  assert.match(markup(rabbit, { clean: false, bones: true }), /labelText/);
});

test('rabbit muzzle protrudes and its base draws behind the head in both flat side views', () => {
  const head = rabbit.plates.find(p => p.id === 'headPlate');
  const muzzle = rabbit.joints.find(j => j.id === 'muzzle');
  assert.ok(muzzle.bind[0] > head.size[0] / 2);
  for (const heading of [90, 270]) for (const time of [0, .25, .5, .75, 1]) {
    useRig(rabbit, { elevation: 0, heading });
    const elements = core.projectedRenderPlan(rabbit, time, 'walk').groups.find(g => g.id === 'coreSurfaceGroup').elements;
    const index = id => elements.findIndex(e => e.id === id);
    assert.ok(index('muzzleConnectorPlate') < index('headPlate'));
    assert.ok(index('muzzlePlate') < index('headPlate'));
  }
});
