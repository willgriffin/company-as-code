# Flux GitOps Configuration
# This file manages the Flux bootstrap process using the Flux Terraform provider
# Documentation: https://registry.terraform.io/providers/fluxcd/flux/latest/docs

# Configure the Flux provider
provider "flux" {
  kubernetes = {
    host                   = digitalocean_kubernetes_cluster.main.endpoint
    token                  = digitalocean_kubernetes_cluster.main.kube_config[0].token
    cluster_ca_certificate = base64decode(digitalocean_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
  }
  git = {
    url = "https://github.com/${var.github_owner}/${var.github_repository}.git"
    http = {
      username = "git" # For GitHub, the username is always 'git'
      password = var.github_token
    }
  }
}

# Bootstrap Flux
resource "flux_bootstrap_git" "this" {
  depends_on = [digitalocean_kubernetes_cluster.main]

  # Git repository settings
  repository_name = var.github_repository
  branch          = var.flux_target_branch
  path            = var.flux_target_path

  # Flux components to install
  components_extra = [
    "image-reflector-controller",
    "image-automation-controller"
  ]

  # Flux version (optional, defaults to latest)
  # version = "v2.3.0"

  # Network policy
  network_policy = true

  # Interval at which to reconcile from the source repository
  interval = "10m0s"

  # Log level
  log_level = "info"

  # Toleration keys for all Flux components
  toleration_keys = []

  # Registry to pull Flux images from
  registry = "ghcr.io/fluxcd"

  # Whether to create the repository if it doesn't exist
  # (requires appropriate GitHub permissions)
  # repository_visibility = "private"

  # Kubernetes secret name for git authentication
  secret_name = "flux-system"

  # Namespace to install Flux into
  namespace = "flux-system"

  # Additional manifests to apply after bootstrap
  # Can be used to apply SOPS configuration
  manifests_path = "./clusters/cumulus/flux-system"
}

# Create SOPS age secret for decryption
resource "kubernetes_secret" "sops_age" {
  depends_on = [flux_bootstrap_git.this]

  metadata {
    name      = "sops-age"
    namespace = "flux-system"
  }

  data = {
    "age.key" = var.sops_age_private_key
  }

  type = "Opaque"
}

# Patch kustomize-controller to use SOPS age key
resource "kubernetes_manifest" "kustomize_controller_patch" {
  depends_on = [
    flux_bootstrap_git.this,
    kubernetes_secret.sops_age
  ]

  manifest = {
    apiVersion = "apps/v1"
    kind       = "Deployment"
    metadata = {
      name      = "kustomize-controller"
      namespace = "flux-system"
    }
    spec = {
      template = {
        spec = {
          containers = [{
            name = "manager"
            env = [{
              name  = "SOPS_AGE_KEY_FILE"
              value = "/tmp/age/age.key"
            }]
            volumeMounts = [{
              name      = "sops-age"
              mountPath = "/tmp/age"
              readOnly  = true
            }]
          }]
          volumes = [{
            name = "sops-age"
            secret = {
              secretName = "sops-age"
            }
          }]
        }
      }
    }
  }

  field_manager {
    name            = "terraform"
    force_conflicts = true
  }

  computed_fields = [
    "spec.template.spec.containers[0].image",
    "spec.template.spec.containers[0].imagePullPolicy",
    "spec.template.spec.containers[0].resources",
    "spec.template.spec.containers[0].ports",
    "spec.template.spec.containers[0].livenessProbe",
    "spec.template.spec.containers[0].readinessProbe",
    "spec.template.spec.containers[0].securityContext",
    "spec.template.spec.containers[0].args",
    "spec.template.spec.containers[0].command",
    "spec.template.metadata",
    "spec.replicas",
    "spec.selector",
    "metadata.annotations",
    "metadata.labels",
    "metadata.finalizers",
    "metadata.ownerReferences"
  ]
}

# Output Flux status
output "flux_namespace" {
  value = flux_bootstrap_git.this.namespace
}

output "flux_version" {
  value = flux_bootstrap_git.this.version
}

output "flux_path" {
  value = flux_bootstrap_git.this.path
}