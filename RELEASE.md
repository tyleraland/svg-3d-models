# Release process

The workspace version is `0.2.0`. All public `@paper-rig/*` packages and the
private workbench use the same version, and internal dependencies use the
matching caret range. `npm run check:release` enforces that invariant.

## Release gate

1. `npm ci`
2. `npm run check`
3. `npm run build-workbench` and verify no generated diff
4. `npm run test:workbench`
5. `npm pack --dry-run --json --workspaces`
6. Review `CHANGELOG.md`, `MIGRATION.md`, the four representative M6 handoffs,
   and contact sheets/audits for changed models.

## Registry publication boundary

This repository does not currently configure registry credentials, ownership
of the `@paper-rig` npm scope, or a project license. Those are release-owner
decisions, not defaults an agent should guess. Until all three are explicit,
the supported release is a verified source revision on `main`; do not run
`npm publish`.

Once the release owner supplies those prerequisites, publish in dependency
order: schema; compiler/attachments/motion/appearance/handoff; rigs; validator;
CLI. Use the same immutable version for the complete set, then tag the verified
commit. Never publish the private workbench package.
