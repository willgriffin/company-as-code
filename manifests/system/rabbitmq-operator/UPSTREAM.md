# Vendored RabbitMQ Cluster Operator

`cluster-operator-v2.22.5.yaml` is the reviewed upstream release asset from:

```text
https://github.com/rabbitmq/cluster-operator/releases/download/v2.22.5/cluster-operator.yml
```

SHA-256:

```text
f7d3a549a2514ea3de3a91b231a969dbfee0520f467d2fbe91821b9388f48dbe
```

Vendor a new version and update this digest in the same reviewed change. Flux
must not fetch this cluster-admin artifact from a mutable HTTPS URL at
reconciliation time.

The upstream asset references a mutable image tag. `kustomization.yaml`
replaces it at render time with the reviewed multi-architecture index digest
`sha256:2727b84b835ada97247bbb65ebfa6998168b4e8ee11b0e6cece56ac2c9c4f0fb`.
Review and update that digest alongside any vendored operator upgrade.
