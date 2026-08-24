#!/usr/bin/env bash

# Render every Kustomization in the repository.  A root-cluster render alone
# can miss a broken reusable base, so each package is checked independently.

set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
MANIFEST_ROOT=${MANIFEST_ROOT:-"$ROOT_DIR/manifests"}
OUT_DIR=${1:-"$ROOT_DIR/.ci/rendered-manifests"}
OUT_DIR=$(python3 -c 'from pathlib import Path; import sys; print(Path(sys.argv[1]).resolve())' "$OUT_DIR")
SAFE_REPO_OUT=$(python3 -c 'from pathlib import Path; import sys; print(Path(sys.argv[1]).resolve())' "$ROOT_DIR/.ci")
COMBINED="$OUT_DIR/all.yaml"

case "$OUT_DIR" in
  "$SAFE_REPO_OUT"/*|/tmp/company-as-code-render.*) ;;
  *)
    echo "::error::refusing to replace unsafe output directory: $OUT_DIR" >&2
    echo "Use a path below $SAFE_REPO_OUT/ or /tmp/company-as-code-render.*" >&2
    exit 2
    ;;
esac

if ! command -v kubectl >/dev/null 2>&1; then
  echo "::error::kubectl is required to render Kustomizations" >&2
  exit 1
fi

if [ ! -d "$MANIFEST_ROOT" ]; then
  echo "::error::manifest directory does not exist: $MANIFEST_ROOT" >&2
  exit 1
fi

rm -rf -- "$OUT_DIR"
mkdir -p "$OUT_DIR"
: > "$COMBINED"

failures=0
rendered=0

while IFS= read -r kustomization; do
  dir=${kustomization%/kustomization.yaml}
  relative=${dir#"$ROOT_DIR/"}
  safe_name=$(printf '%s' "$relative" | sed 's#[^A-Za-z0-9_.-]#_#g')
  out_file="$OUT_DIR/${safe_name}.yaml"
  err_file="$OUT_DIR/${safe_name}.err"

  if kubectl kustomize "$dir" >"$out_file" 2>"$err_file"; then
    printf '\n---\n# Source kustomization: %s\n' "$relative" >>"$COMBINED"
    cat "$out_file" >>"$COMBINED"
    rendered=$((rendered + 1))
    rm -f -- "$err_file"
  else
    echo "::error file=$kustomization::kubectl kustomize failed for $relative" >&2
    sed -n '1,40p' "$err_file" >&2
    failures=$((failures + 1))
  fi
done < <(find "$MANIFEST_ROOT" -type f -name kustomization.yaml -print | sort)

if [ "$rendered" -eq 0 ]; then
  echo "::error::no Kustomizations found below $MANIFEST_ROOT" >&2
  exit 1
fi

echo "Rendered $rendered Kustomization(s)."
if [ "$failures" -gt 0 ]; then
  echo "Found $failures Kustomization render failure(s)." >&2
  exit 1
fi
