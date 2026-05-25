# Secrets

Secret files are committed only as templates unless SOPS-encrypted. Do not commit real plaintext values. SOPS age material belongs in the cluster `flux-system/sops-age` secret and in an external password vault or offline backup.

Keep `*.secret.template.yaml` files out of deployable `kustomization.yaml` resources. For a real deployment, copy the relevant template to `*.secret.enc.yaml`, replace placeholders, encrypt it with SOPS, and add that encrypted file to the owning kustomization.
