#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-my-tenant}"
SECRET_NAME="${SECRET_NAME:-my-tenant-admin}"
KEY="${KEY:-password}"

kubectl get secret "${SECRET_NAME}" -n "${NAMESPACE}" -o "jsonpath={.data.${KEY}}" | base64 -d
echo
