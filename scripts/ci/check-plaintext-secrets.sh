#!/usr/bin/env bash

# Reject deployable Kubernetes Secrets unless they are explicitly templates or
# SOPS-encrypted files.  Filename conventions are useful, but the SOPS marker
# is also checked so a correctly encrypted file may use another name.

set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
MANIFEST_ROOT=${MANIFEST_ROOT:-"$ROOT_DIR/manifests"}

if ! command -v yq >/dev/null 2>&1; then
  echo "::error::yq is required to inspect Kubernetes Secret manifests" >&2
  exit 1
fi
if [ ! -d "$MANIFEST_ROOT" ]; then
  echo "::error::manifest directory does not exist: $MANIFEST_ROOT" >&2
  exit 1
fi

is_sops_encrypted_document() {
  yq -e '
    select(documentIndex == '"$2"') |
    select(.sops != null) |
    [((.data // {})[]), ((.stringData // {})[])] as $payload |
    select(($payload | length) > 0) |
    select(([$payload[] |
      select((tag != "!!str") or (test("^ENC\\[AES256_GCM,") | not))
    ] | length) == 0)
  ' "$1" >/dev/null 2>&1
}

failures=0
while IFS= read -r file; do
  if ! secret_document_indexes=$(
    yq -N 'select(tag == "!!map") | select(.kind == "Secret") | documentIndex' "$file"
  ); then
    echo "::error file=$file::Unable to inspect YAML documents for plaintext Secrets" >&2
    failures=$((failures + 1))
    continue
  fi
  [[ -n "$secret_document_indexes" ]] || continue

  secret_found=false
  payloads_encrypted=true
  while IFS= read -r document_index; do
    secret_found=true
    if ! is_sops_encrypted_document "$file" "$document_index"; then
      payloads_encrypted=false
      break
    fi
  done <<< "$secret_document_indexes"

  [[ "$secret_found" == true ]] || continue

  case "$file" in
    *.secret.template.yaml) continue ;;
  esac
  if [[ "$payloads_encrypted" == true ]]; then
    continue
  fi

  echo "::error file=$file::Plaintext Kubernetes Secret; use *.secret.template.yaml or a SOPS-encrypted file" >&2
  failures=$((failures + 1))
done < <(find "$MANIFEST_ROOT" -type f \( -name '*.yaml' -o -name '*.yml' \) -print | sort)

if [ "$failures" -gt 0 ]; then
  echo "Found $failures plaintext Kubernetes Secret manifest(s)." >&2
  exit 1
fi

echo "No plaintext Kubernetes Secret manifests found."
