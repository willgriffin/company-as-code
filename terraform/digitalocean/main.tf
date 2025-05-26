provider "digitalocean" {
  token = var.do_token
}

# Data source to get available Kubernetes versions
data "digitalocean_kubernetes_versions" "available" {
  version_prefix = "1.29."
}

# DigitalOcean Kubernetes Cluster
resource "digitalocean_kubernetes_cluster" "main" {
  name    = var.cluster_name
  region  = var.region
  version = coalesce(var.kubernetes_version, data.digitalocean_kubernetes_versions.available.latest_version)

  # Using default VPC
  vpc_uuid = null

  node_pool {
    name       = var.node_pool_name
    size       = var.node_size
    node_count = var.node_count
    auto_scale = var.auto_scale
    min_nodes  = var.auto_scale ? var.min_nodes : null
    max_nodes  = var.auto_scale ? var.max_nodes : null

    labels = {
      environment = "production"
      managed_by  = "terraform"
      project     = var.project_name
    }

    tags = concat(var.tags, [var.cluster_name, var.project_name])
  }

  maintenance_policy {
    day        = "sunday"
    start_time = "04:00"
  }

  tags = concat(var.tags, [var.cluster_name, var.project_name])
}

# Configure cluster autoscaler for conservative scaling
resource "digitalocean_kubernetes_node_pool" "additional" {
  count = 0 # Set to 1 if you need additional node pools

  cluster_id = digitalocean_kubernetes_cluster.main.id
  name       = "${var.node_pool_name}-additional"
  size       = var.node_size
  node_count = var.min_nodes
  auto_scale = true
  min_nodes  = var.min_nodes
  max_nodes  = var.max_nodes

  labels = {
    environment = "production"
    managed_by  = "terraform"
    project     = var.project_name
    pool_type   = "additional"
  }

  tags = concat(var.tags, [var.cluster_name, var.project_name, "additional"])
}