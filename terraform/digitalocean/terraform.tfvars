cluster_name       = "cumulus"
region            = "nyc3"
# kubernetes_version is auto-detected from latest available

# Node pool configuration
node_pool_name = "cumulus1"
node_size      = "s-2vcpu-2gb"
node_count     = 2
min_nodes      = 2
max_nodes      = 3
auto_scale     = true

tags = [
  "kubernetes",
  "managed",
  "terraform",
  "production"
]

project_name = "happyvertical-blueprint"

# Flux GitOps configuration
github_owner       = "happyvertical"
github_repository  = "blueprint"
flux_target_branch = "main"
flux_target_path   = "./flux/clusters/cumulus"

# Sensitive variables will be passed via environment variables:
# TF_VAR_do_token
# TF_VAR_spaces_access_key  
# TF_VAR_spaces_secret_key
# TF_VAR_github_token
# TF_VAR_sops_age_private_key
