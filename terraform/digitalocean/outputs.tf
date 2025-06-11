output "cluster_id" {
  description = "ID of the DigitalOcean Kubernetes cluster"
  value       = digitalocean_kubernetes_cluster.main.id
}

output "cluster_name" {
  description = "Name of the DigitalOcean Kubernetes cluster"
  value       = digitalocean_kubernetes_cluster.main.name
}

output "cluster_endpoint" {
  description = "Endpoint for the Kubernetes API server"
  value       = digitalocean_kubernetes_cluster.main.endpoint
  sensitive   = true
}

output "cluster_token" {
  description = "Token for authentication to the cluster"
  value       = digitalocean_kubernetes_cluster.main.kube_config[0].token
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "Base64 encoded certificate authority data"
  value       = digitalocean_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate
  sensitive   = true
}

output "kubeconfig" {
  description = "Kubeconfig file content"
  value       = digitalocean_kubernetes_cluster.main.kube_config[0].raw_config
  sensitive   = true
}

output "cluster_version" {
  description = "Kubernetes version of the cluster"
  value       = digitalocean_kubernetes_cluster.main.version
}

output "cluster_status" {
  description = "Status of the cluster"
  value       = digitalocean_kubernetes_cluster.main.status
}

output "cluster_created_at" {
  description = "When the cluster was created"
  value       = digitalocean_kubernetes_cluster.main.created_at
}

output "cluster_updated_at" {
  description = "When the cluster was last updated"
  value       = digitalocean_kubernetes_cluster.main.updated_at
}

output "node_pool_ids" {
  description = "IDs of the node pools"
  value       = [for np in digitalocean_kubernetes_cluster.main.node_pool : np.id]
}

output "node_pool_sizes" {
  description = "Sizes of the node pools"
  value       = [for np in digitalocean_kubernetes_cluster.main.node_pool : np.size]
}

output "node_pool_node_counts" {
  description = "Node counts for each pool"
  value       = [for np in digitalocean_kubernetes_cluster.main.node_pool : np.node_count]
}

# Backup storage outputs
output "backup_bucket_name" {
  description = "Name of the backup storage bucket"
  value       = digitalocean_spaces_bucket.backup.name
}

output "backup_bucket_region" {
  description = "Region of the backup storage bucket"
  value       = digitalocean_spaces_bucket.backup.region
}

output "backup_bucket_endpoint" {
  description = "Endpoint URL for the backup storage bucket"
  value       = "https://${digitalocean_spaces_bucket.backup.region}.digitaloceanspaces.com"
}

output "backup_bucket_domain" {
  description = "Domain name of the backup storage bucket"
  value       = digitalocean_spaces_bucket.backup.bucket_domain_name
}

output "archive_bucket_name" {
  description = "Name of the archive storage bucket (if enabled)"
  value       = var.enable_archive_bucket ? digitalocean_spaces_bucket.archive[0].name : null
}

output "backup_configuration" {
  description = "Backup configuration summary"
  value = {
    retention_days         = var.backup_retention_days
    version_retention_days = var.backup_version_retention_days
    archive_days          = var.backup_archive_days
    archive_enabled       = var.enable_archive_bucket
    encryption_enabled    = var.backup_encryption_enabled
  }
}