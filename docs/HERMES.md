# Hermes packaging and rollout

## Decision

The Hermes operator and runtime stay in the separately versioned
`org-as-code` repository. `org-as-code` owns the CRDs, controllers, Helm chart,
and runtime image release. `company-as-code` owns only the consumer wiring and
generic declarations.

This keeps the reusable platform template independent of a private operator
implementation and gives the operator its own compatibility, signing, and
rollback lifecycle.

The operator consumer is not an in-place migration of the legacy Hermes
Deployment. Existing installations must complete the live suspend/prune
preflight documented in
[Deployment](DEPLOYMENT.md#mandatory-existing-install-preflight) before the
Git source advances. The checked-in prune flag cannot prevent a reconciliation
race by itself, and the operator example never copies the old PVCs.

## Consumer contract

The platform repository consumes an OCI chart through Flux. The reference
consumer wiring lives under `manifests/system/org-as-code-operator/`:

- pin an immutable released chart version (and, where the registry supports
  it, its digest) rather than tracking `latest`;
- require the chart signature with Flux's OCI verification configuration and a
  public verification key kept as non-secret policy or a referenced Secret;
- set Helm CRD installation/upgrade to `CreateReplace`, because chart CRDs
  must evolve with the operator; and
- keep both `directoryApply: false` and `workloadApply: false` by default (and
  keep the active namespace list empty until a rollout is approved).

These gates are safety controls: the operator can validate and report on
declarations without provisioning directory accounts or creating/replacing
Hermes runtime workloads. Enable either form of actuation only in an explicitly
reviewed tenant/cluster overlay after the chart, CRDs, image, credentials, and
recovery behavior have been verified.

The chart creates a namespace-scoped Role and RoleBinding in every declared
managed namespace even while actuation is disabled. That access is required to
observe and validate the Kubernetes declarations; keep `managedNamespaces`
narrow and do not treat the actuation gates as RBAC-emission switches.

The reference package pins the currently verified v0.1.2 digest and its
keyless GitHub Actions release identity. Changing either is a release update,
not a deployment-time substitution.

The chart and manager image are currently private GHCR artifacts. The cluster
entrypoint therefore exposes the operator and example as separate, suspended
Flux Kustomizations in `manifests/clusters/my-cluster/applications.yaml`.
Supply encrypted pull Secrets and review the published CRDs before removing
either suspension; the rest of the tenant can reconcile independently.

The v0.1.2 chart admits both `Agent.spec.activate` and typed,
same-namespace `HermesWorkload.spec.secrets`. The checked-in example sets
`activate: false`, keeps the workload suspended at zero replicas, and references
an optional runtime Secret whose template carries the operator's required
`org.willgriffin.dev/managed-secret: "true"` label. A referenced Secret must be
delivered through environment variables, a read-only mount, or both. Replace
the example's contract ref and runtime image digest, encrypt the Secret, and
review both global actuation gates before enabling any live workload.

## Generic fleet declaration

The following is a shape example for a tenant overlay. It contains no
organization identity. Apply it only after the operator chart is installed and
its CRDs are ready.

```yaml
apiVersion: hermes.willgriffin.dev/v1alpha1
kind: HermesWorkload
metadata:
  name: example-fleet
  namespace: example-client
spec:
  replicas: 0
  agentRef:
    name: example-agent
  suspend: true
  persistence: durable
  image: TEMPLATE_HERMES_RUNTIME_IMAGE@sha256:TEMPLATE_HERMES_RUNTIME_DIGEST
  secrets:
    - name: hermes-runtime-secrets
      env: true
      optional: true
```

With the default actuation gate and suspended workload, this object is observed
but does not launch a runtime. A live replica and secret-backed provider
configuration remain deployment-specific, explicitly reviewed decisions.

## Boundary with the existing workload tree

Application and tenant manifests may carry runtime configuration and storage
for a selected Hermes deployment, but they must not vendor the operator source
or silently imply a chart release. Keep chart upgrades, CRD changes, image
changes, and actuation enablement as separately reviewed changes.
