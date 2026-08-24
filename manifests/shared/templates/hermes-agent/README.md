# hermes-agent

This is the organization-neutral Hermes workload template. The operator owns
the workload lifecycle through the `HermesWorkload` API; a consumer supplies an
image, resource and scheduling constraints, and explicit egress rules.

The safe template defaults are suspended with zero replicas. Consumers must
make activation and any network egress an explicit reviewed change.

The pinned v0.1.2 operator CRD does not yet admit typed Secret references.
Keep workloads suspended until a signed release adds that schema; do not place
credential values in `spec.env`.
