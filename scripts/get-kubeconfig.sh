#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-my-cluster}"
KUBECONFIG_OUT="${KUBECONFIG_OUT:-$HOME/.kube/config}"

echo "Fetch kubeconfig for ${CLUSTER_NAME} using your provider-specific node template or secret source."
echo "Write or merge it at: ${KUBECONFIG_OUT}"
