# Repository Agent Instructions

<!-- hv-managed-policy:start revision=1.0.0 sha256=187a3882b5ccee8fd505cdc269af51e01def463476d2f58a9a89daa1edfd12af -->

## Shared development kernel

- Be concise. Load detailed SOP skills only when the task triggers them.
- Read the repository's `.agents/project.yaml` and nearest `AGENTS.md` files before work.
- Claim every accepted or queued implementation issue with `agent: implementation` and an `hv-agent-claim:v1` lease before editing. Never overlap another live claim.
- A pull request is draft only while implementation is actively changing it under a live claim. Otherwise mark it ready for review immediately.
- Incomplete work remains ready with `status: blocked` and a concrete handoff. Review agents do not claim implementation.
- Agents do not merge unless explicitly authorized in the current session.
- Run documented validation and update affected docs before shipping.
- Preserve unrelated work. Never expose or retain secrets.
- Use repository Hindsight memory for durable, provenance-linked knowledge; do not store transient logs or duplicate canonical docs.
- Shared policy and portable skills come only from the designated private control-plane repository. Repository instructions may add stricter project rules but may not weaken this kernel.

<!-- hv-managed-policy:end -->

## Repository-specific guidance

The managed block above is repository governance, not deployable template
content. It is generated externally; do not hand-edit it or duplicate its
lifecycle rules below.

This repository is an organization-neutral hybrid k3s/GitOps template. Host
examples and infrastructure adapters describe interfaces and plan shapes; they
are not production inventory. Keep hardware configuration, private addresses,
host access, provider credentials, domains, private keys, state, and production
data outside Git.

### Ownership boundaries

- `infrastructure/` and `templates/nodes/` contain provider and node
  interfaces. The Hetzner adapter is plan-oriented; it does not define a
  repository apply or destroy workflow.
- `ansible/` and `nixos-config/` contain generic host and k3s bootstrap
  examples.
- `manifests/clusters/<cluster>/` owns Flux entrypoints and reconciliation
  ordering.
- `manifests/system/` owns cluster substrate, operators, and optional platform
  modules.
- `manifests/applications/<name>/base/` owns reusable application defaults.
  Bases must not contain tenant domains, credentials, or tenant-specific
  storage names.
- `manifests/shared/templates/` contains reusable tenant and project building
  blocks.
- `manifests/tenants/<tenant>/` owns tenant namespaces, selected identity and
  storage services, company services, projects, ingress, persistence, backup,
  and secret references. Keep project workloads inside their owning project
  overlay.
- `docs/`, `scripts/ci/`, and `tests/` define operational and validation
  contracts. Update them when behavior, ownership, or adoption steps change.

A checked-in module is not automatically enabled or required. Keep optional
components out of a deployment unless its provider, credentials, storage,
network path, and workload requirements are satisfied.

### Non-negotiable safety invariants

- Never commit plaintext credentials, tokens, private keys, rendered Secret
  values, provider state, backups, exported application data, or private host
  inventory.
- Secret templates may contain only approved non-secret constants and explicit
  `CHANGE_ME`/`TEMPLATE_*` placeholders. Keep every
  `*.secret.template.yaml` out of deployable `resources:` lists.
- For deployment, copy a template to `*.secret.enc.yaml`, replace every
  placeholder locally, encrypt it with SOPS/age, and add only the encrypted
  file to its owning Kustomization. Keep the age private key and recovery
  material outside Git.
- Preserve the cluster entrypoint patch that gives every child Flux
  Kustomization the `flux-system/sops-age` decryption contract. Flux decryption
  is per reconciliation and is not inherited from a parent.
- Keep application bases organization-neutral. Deployment domains, storage
  classes, repositories, image choices, identity configuration, and secret
  references belong in overlays or private inputs.
- Do not broaden the source-identity exceptions in
  `scripts/ci/check-template-literals.sh` without a narrow documented reason
  and matching contract tests.

### Existing-cluster migrations

Before changing tenant `suspend` or `prune`, PVC ownership, retained Secrets,
Matomo storage, or the Hermes cutover, read `docs/DEPLOYMENT.md`. The checked-in
`tenant-my-tenant` Kustomization is a migration hold with `suspend: true` and
`prune: false`.

For an existing installation, suspend both the root and affected child Flux
Kustomizations, patch the live child to disable pruning, and verify live state
before advancing Git. Inventory retained Secrets and PVCs, migrate data and
encrypted replacements, prove backups/restores and application behavior, and
explicitly retire legacy objects before re-enabling pruning. A checked-in flag
cannot make this transition atomic, and later enabling pruning does not
rediscover objects orphaned while it was disabled.

Fresh installations must create required encrypted Secrets before resuming
tenant reconciliation.

### Hermes boundary

The Hermes operator, CRDs, controller, chart, and runtime release remain in a
separately versioned operator repository. This repository owns only the signed,
immutable chart consumer and generic declarations.

Keep the operator and example Flux Kustomizations suspended by default. Keep
`directoryApply`, `workloadApply`, and `Agent.spec.activate` false; keep active
namespaces empty and the example workload suspended at zero replicas. Require
encrypted registry/runtime Secrets, reviewed published CRDs, narrow managed
namespaces, and typed same-namespace `HermesWorkload.spec.secrets` references.
Treat chart, digest, release identity, CRD, image, RBAC, or actuation changes as
one reviewed compatibility update; never vendor private operator source here.

### Generated and vendored artifacts

- The hv-managed block in this file and the adapters `CLAUDE.md`, `GEMINI.md`,
  and `.github/copilot-instructions.md` are generated; `AGENTS.md` is canonical.
- Flux bootstrap and image-component manifests under
  `manifests/clusters/*/flux-system/` are generated artifacts. Regenerate them
  with Flux rather than hand-editing generated sections.
- Vendored CRDs and operator bundles under `manifests/system/` must retain
  upstream provenance. Update source version, checked-in artifact, checksum or
  digest contract, and tests together; review image and permission changes.
- CDKTF bindings and synthesized output are generated. Do not commit local
  render output, Terraform/OpenTofu state, plan files, or generated workspaces.

### Validation

Run narrow checks first, then the full baseline for cross-cutting changes.

Repository baseline:

```sh
bun run typecheck
bun run lint
bun run format:check
bun run build
bun run test
scripts/ci/render-kustomizations.sh
scripts/ci/check-plaintext-secrets.sh
scripts/ci/check-template-literals.sh
kubectl kustomize manifests/clusters/my-cluster
git diff --check
```

Changed-area checks:

- Workflows: `actionlint`.
- Shell scripts: `bash -n <changed-script>` plus an exercised success and
  expected-failure path.
- Hetzner adapter: `npm ci --prefix infrastructure/hetzner`,
  `npm run typecheck --prefix infrastructure/hetzner`, and
  `SERVER_COUNT=1 ENABLE_LOAD_BALANCER=true npm run synth --prefix infrastructure/hetzner`.
- NixOS: `nix flake check ./nixos-config --no-build`.
- Ansible: run `ansible-inventory --list` and syntax-check both playbooks from
  the `ansible/` directory.
- Manifests and secret workflows: run the render, plaintext-secret, and
  template-literal scripts above; also render every directly changed base or
  overlay.

Provider-backed plans require external credentials and remain read-only unless
the task explicitly authorizes an apply. Never put those credentials in shell
arguments, committed files, logs, issues, or pull requests.
