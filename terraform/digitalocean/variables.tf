variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
  default     = "cumulus"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "kubernetes_version" {
  description = "Kubernetes version to use (if not provided, uses latest available)"
  type        = string
  default     = null
}

variable "node_pool_name" {
  description = "Name of the node pool"
  type        = string
  default     = "cumulus1"
}

variable "node_size" {
  description = "Size of the nodes"
  type        = string
  default     = "s-1vcpu-2gb"
}

variable "min_nodes" {
  description = "Minimum number of nodes in the pool"
  type        = number
  default     = 2
}

variable "max_nodes" {
  description = "Maximum number of nodes in the pool"
  type        = number
  default     = 3
}

variable "node_count" {
  description = "Initial number of nodes in the pool"
  type        = number
  default     = 2
}

variable "auto_scale" {
  description = "Enable autoscaling for the node pool"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = list(string)
  default     = ["kubernetes", "managed", "terraform"]
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "Happy Vertical Corporation"
}

# Backend configuration variables
variable "spaces_access_key" {
  description = "DigitalOcean Spaces access key for Terraform state backend"
  type        = string
  sensitive   = true
}

variable "spaces_secret_key" {
  description = "DigitalOcean Spaces secret key for Terraform state backend"
  type        = string
  sensitive   = true
}