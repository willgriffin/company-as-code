# org-as-code operator

This package installs the signed v0.1.2 `org-as-code` OCI chart and its CRDs
through Flux. The chart source is pinned to the release digest and accepts
only the upstream GitHub Actions Cosign identity.

The chart and manager image are private GHCR artifacts. Create SOPS-encrypted
copies of both `*.secret.template.yaml` files and add the encrypted filenames
to `kustomization.yaml` before enabling this package.

The package is intentionally inert for consumers: it manages only the generic
`org-example` namespace, has no active namespaces, and sets both directory and
workload application gates to `false`. Enable those values only as part of a
reviewed consumer rollout.

The v0.1.2 CRDs admit `Agent.spec.activate` and typed,
same-namespace `HermesWorkload.spec.secrets`. The example sets activation to
false, references an optional labeled Secret, and remains inactive. Encrypt
the Secret template, pin the workload image and agent contract, and review the
global actuation gates before enabling a live workload.
