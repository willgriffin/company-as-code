cluster_name       = "cumulus"
region            = "nyc3"
kubernetes_version = "1.32.2-do.1"

# Node pool configuration
node_pool_name = "cumulus1"
node_size      = "s-1vcpu-2gb"
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
