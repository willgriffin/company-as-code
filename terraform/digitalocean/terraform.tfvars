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
