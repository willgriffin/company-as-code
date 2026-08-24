# Vendored Gateway API CRDs

`standard-install-v1.3.0.yaml` is the reviewed upstream release asset from:

```text
https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.3.0/standard-install.yaml
```

SHA-256:

```text
78796d5c51450fc55d8dc8092ba8137f8c807982d7508d7875d5c537a24082b9
```

Vendor a new version and update this digest in the same reviewed change. Flux
must not fetch this cluster-admin artifact from a mutable HTTPS URL at
reconciliation time.
