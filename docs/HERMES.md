# Hermes packaging and rollout

## Decision

The Hermes operator and runtime stay in the separately versioned
`org-as-code` repository. `org-as-code` owns the CRDs, controllers, Helm chart,
and runtime image release. `company-as-code` owns only the consumer wiring and
generic declarations.

This keeps the reusable platform template independent of a private operator
implementation and gives the operator its own compatibility, signing, and
rollback lifecycle.

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

The reference package pins the currently verified v0.1.2 digest and its
keyless GitHub Actions release identity. Changing either is a release update,
not a deployment-time substitution.

The chart and manager image are currently private GHCR artifacts. The cluster
entrypoint therefore exposes the operator and example as separate, suspended
Flux Kustomizations in `manifests/clusters/my-cluster/applications.yaml`.
Supply encrypted pull Secrets and review the published CRDs before removing
either suspension; the rest of the tenant can reconcile independently.

The v0.1.2 chart also has a material schema limit: it does not admit
`Agent.spec.activate` or `HermesWorkload.spec.secrets`. The checked-in example
omits both. It must remain non-actuating until a newer signed release preserves
typed secret references for the runtime.

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
  image: TEMPLATE_HERMES_RUNTIME_IMAGE
```

With the default actuation gate and suspended workload, this object is observed
but does not launch a runtime. A live replica and secret-backed provider
configuration are deployment-specific decisions and require a compatible
operator release.

## Boundary with the existing workload tree

Application and tenant manifests may carry runtime configuration and storage
for a selected Hermes deployment, but they must not vendor the operator source
or silently imply a chart release. Keep chart upgrades, CRD changes, image
changes, and actuation enablement as separately reviewed changes.
