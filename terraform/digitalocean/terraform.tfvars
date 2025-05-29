cluster_name       = "cumulus"
region            = "nyc3"
kubernetes_version = "1.32.2"

# Node pool configuration
node_pool_name = "cumulus1"
node_size      = "s-1vcpu-2gb"   # Basic AMD $14/month
node_count     = 2               # Initial number of nodes
min_nodes      = 2               # Minimum nodes for autoscaling
max_nodes      = 3               # Maximum nodes for autoscaling
auto_scale     = true            # Enable autoscaling

tags = [
  "kubernetes",
  "managed",
  "terraform",
  "production"
]

project_name = "have-blueprint"
