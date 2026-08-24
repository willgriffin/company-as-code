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
    [
      .. |
      select(tag == "!!map" and .apiVersion == "v1" and .kind == "Secret" and .metadata.name != null) |
      ([((.data // {})[])] + [((.stringData // {})[])])[]
    ] as $payload |
    select(($payload | length) > 0) |
    select(([$payload[] |
      select((tag != "!!str") or (test("^ENC\\[AES256_GCM,") | not))
    ] | length) == 0)
  ' "$1" >/dev/null 2>&1
}

is_safe_template_document() {
  yq -e '
    select(documentIndex == '"$2"') |
    [
      .. |
      select(tag == "!!map" and .apiVersion == "v1" and .kind == "Secret" and .metadata.name != null) |
      ([((.data // {})[])] + [((.stringData // {})[])])[]
    ] as $payload |
    select(($payload | length) > 0) |
    select(([$payload[] |
      select(
        (tag != "!!str") or
        (((
          test("(^|[^A-Za-z0-9_])CHANGE_ME(_[A-Z0-9_]+)?($|[^A-Za-z0-9_])") or
          test("(^|[^A-Za-z0-9_])TEMPLATE_[A-Z0-9_]+($|[^A-Za-z0-9_])") or
          . == "garage" or
          . == "garage-archive" or
          . == "dex" or
          . == "false" or
          . == "Authorization"
        )) | not)
      )
    ] | length) == 0)
  ' "$1" >/dev/null 2>&1
}

failures=0
while IFS= read -r file; do
  if ! secret_document_indexes=$(
    yq -N '
      select(tag == "!!map") |
      select([
        .. |
        select(tag == "!!map" and .apiVersion == "v1" and .kind == "Secret" and .metadata.name != null)
      ] | length > 0) |
      documentIndex
    ' "$file"
  ); then
    echo "::error file=$file::Unable to inspect YAML documents for plaintext Secrets" >&2
    failures=$((failures + 1))
    continue
  fi
  [[ -n "$secret_document_indexes" ]] || continue

  secret_found=false
  template_payloads_safe=true
  payloads_encrypted=true
  while IFS= read -r document_index; do
    secret_found=true
    if [[ "$file" == *.secret.template.yaml || "$file" == *.secret.template.yml ]]; then
      if ! is_safe_template_document "$file" "$document_index"; then
        template_payloads_safe=false
      fi
      continue
    fi
    if ! is_sops_encrypted_document "$file" "$document_index"; then
      payloads_encrypted=false
    fi
  done <<< "$secret_document_indexes"

  [[ "$secret_found" == true ]] || continue

  case "$file" in
    *.secret.template.yaml|*.secret.template.yml)
      if [[ "$template_payloads_safe" == true ]]; then
        continue
      fi
      echo "::error file=$file::Secret template payloads must all use approved placeholders or documented non-secret constants" >&2
      failures=$((failures + 1))
      continue
      ;;
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
