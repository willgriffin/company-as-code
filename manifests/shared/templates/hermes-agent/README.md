# hermes-agent

This is the organization-neutral Hermes workload template. The operator owns
the workload lifecycle through the `HermesWorkload` API; a consumer supplies an
image, resource and scheduling constraints, and explicit egress rules.

The safe template defaults are suspended with zero replicas. Consumers must
make activation and any network egress an explicit reviewed change.

The pinned v0.1.2 operator supports typed same-namespace Secret references.
Referenced Secrets must carry `org.willgriffin.dev/managed-secret: "true"` and
must be delivered through `env`, a read-only `mountPath`, or both. Keep secret
values out of `spec.env` and store only encrypted Secret manifests in Git.
