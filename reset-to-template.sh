#!/usr/bin/env bash
set -euo pipefail

# This script is intentionally a checker/substitution helper, not a reset
# script. It never deletes files, runs git reset/checkout/clean, or edits secret
# templates. By default it performs a read-only placeholder check.

usage() {
  cat <<'EOF'
Usage:
  ./reset-to-template.sh --check
  ./reset-to-template.sh --set TOKEN=VALUE [--set TOKEN=VALUE ...] [--in-place]

--check       List unresolved template markers (read-only; default).
--set         Prepare a literal TOKEN replacement. TOKEN must begin with
              TEMPLATE_. Secret CHANGE_ME markers are check-only and must be
              handled through the documented encrypted-Secret workflow.
--in-place    Apply --set replacements to tracked non-secret text files.
              Without this flag, print the files that would change.
--help        Show this help.

Examples:
  ./reset-to-template.sh --check
  ./reset-to-template.sh --set TEMPLATE_DOMAIN=example.org
  ./reset-to-template.sh --set TEMPLATE_DOMAIN=example.org --in-place
EOF
}

repo_root=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
mode=check
in_place=false
declare -a replacements=()

while (($# > 0)); do
  case "$1" in
    --check)
      mode=check
      shift
      ;;
    --set)
      (($# >= 2)) || { echo "--set requires TOKEN=VALUE" >&2; exit 2; }
      replacements+=("$2")
      mode='set'
      shift 2
      ;;
    --in-place)
      in_place=true
      mode='set'
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

declare -a files=()
while IFS= read -r file; do
  files+=("$file")
done < <(
  cd "$repo_root"
  git ls-files -z -- '*.yaml' '*.yml' '*.md' '*.json' '*.toml' '*.tf' '*.hcl' |
    while IFS= read -r -d '' file; do
      case "$file" in
        *.secret.template.yaml|*.secret.template.yml|*.secret.enc.yaml|*.secret.enc.yml|.git/*) continue ;;
      esac
      printf '%s\n' "$file"
    done
)

if [[ "$mode" == check ]]; then
  found=false
  for file in "${files[@]}"; do
    [[ -f "$repo_root/$file" ]] || continue
    while IFS=: read -r line text; do
      [[ "$text" == *TEMPLATE_* || "$text" == *CHANGE_ME* ]] || continue
      printf '%s:%s:%s\n' "$file" "$line" "$text"
      found=true
    done < <(grep -nE 'TEMPLATE_[A-Z0-9_]+|CHANGE_ME' "$repo_root/$file" || true)
  done
  if [[ "$found" == true ]]; then
    echo "Unresolved template markers found (expected for a fresh template)." >&2
  else
    echo "No unresolved template markers found."
  fi
  exit 0
fi

((${#replacements[@]} > 0)) || { echo "--set requires at least one TOKEN=VALUE" >&2; exit 2; }

for replacement in "${replacements[@]}"; do
  token=${replacement%%=*}
  [[ "$replacement" == *=* && "$token" =~ ^TEMPLATE_[A-Z0-9_]+$ ]] || {
    echo "Invalid replacement (use a non-secret TEMPLATE_NAME=VALUE token): $replacement" >&2
    exit 2
  }
done

for file in "${files[@]}"; do
  [[ -f "$repo_root/$file" ]] || continue
  matched=false
  for replacement in "${replacements[@]}"; do
    token=${replacement%%=*}
    if grep -Fq "$token" "$repo_root/$file"; then
      matched=true
      break
    fi
  done
  [[ "$matched" == true ]] || continue

  if [[ "$in_place" == true ]]; then
    tmp=$(mktemp "${TMPDIR:-/tmp}/company-as-code.XXXXXX")
    trap 'rm -f "$tmp"' EXIT
    # Preserve source modes when the temporary file replaces a tracked file.
    cp -p "$repo_root/$file" "$tmp"
    for replacement in "${replacements[@]}"; do
      token=${replacement%%=*}
      value=${replacement#*=}
      TOKEN="$token" VALUE="$value" perl -0pi -e 's/(?<![A-Z0-9_])\Q$ENV{TOKEN}\E(?![A-Z0-9_])/$ENV{VALUE}/g' "$tmp"
    done
    if cmp -s "$tmp" "$repo_root/$file"; then
      rm -f "$tmp"
    else
      mv "$tmp" "$repo_root/$file"
      trap - EXIT
      echo "updated $file"
    fi
  else
    echo "would update $file (rerun with --in-place to apply)"
  fi
done
