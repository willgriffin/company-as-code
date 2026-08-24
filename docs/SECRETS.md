# Secrets

This is a public/reusable template. Real credentials must never be committed as
plaintext.

## File workflow

`*.secret.template.yaml` files contain names, keys, and safe placeholders only.
For a deployment:

1. copy the relevant template to `*.secret.enc.yaml`;
2. replace every placeholder locally;
3. encrypt the copy with SOPS using the deployment's age recipient(s);
4. add the encrypted file to the owning Kustomization; and
5. review the diff to confirm that only ciphertext and intended metadata are
   present.

Keep templates out of deployable `resources:` lists. A template accidentally
mounted as a Kubernetes Secret is still a plaintext configuration failure.

## Key custody

Flux needs the cluster's `flux-system/sops-age` Secret to decrypt objects. Keep
the age private key in an external password vault and an offline recovery copy;
Git should contain only the encrypted manifest and, when appropriate, the
public recipient. Rotate recipients through an explicit migration and test
restore before retiring the old key.

## Scope and review

- Keep each secret in the namespace/ownership boundary that consumes it.
- Prefer short-lived or least-privilege provider credentials.
- Do not put tokens in Helm values, `.env.example`, image tags, comments, or
  issue/PR text.
- Review rendered output and CI secret scanning before publishing a change.
- Treat backups and exported state as secret-bearing data; protect their
  credentials and encryption keys separately.

The `.env.example` file is a list of non-secret deployment inputs. It is not a
secret store and must not be copied into a cluster.
