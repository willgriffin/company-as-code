# DigitalOcean Spaces for Nextcloud object storage
resource "digitalocean_spaces_bucket" "nextcloud" {
  name   = "${var.cluster_name}-nextcloud"
  region = var.region
  acl    = "private"

  lifecycle_rule {
    enabled = true
    
    expiration {
      days = 365
      expired_object_delete_marker = true
    }
    
    noncurrent_version_expiration {
      days = 30
    }
  }

  versioning {
    enabled = true
  }
}

# Create access keys for Nextcloud
resource "digitalocean_spaces_bucket_policy" "nextcloud" {
  region = digitalocean_spaces_bucket.nextcloud.region
  bucket = digitalocean_spaces_bucket.nextcloud.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "NextcloudAccess"
        Effect = "Allow"
        Principal = {
          AWS = ["*"]
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload",
          "s3:CreateBucket"
        ]
        Resource = [
          "${digitalocean_spaces_bucket.nextcloud.bucket_domain_name}/*",
          digitalocean_spaces_bucket.nextcloud.bucket_domain_name
        ]
      }
    ]
  })
}

# CORS configuration for Nextcloud
resource "digitalocean_spaces_bucket_cors_configuration" "nextcloud" {
  region = digitalocean_spaces_bucket.nextcloud.region
  bucket = digitalocean_spaces_bucket.nextcloud.name

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    allowed_origins = ["https://cloud.happyvertical.com"]
    expose_headers  = ["ETag", "x-amz-meta-mtime"]
    max_age_seconds = 3000
  }
}

# Output values for Nextcloud configuration
output "nextcloud_spaces_name" {
  description = "Name of the Nextcloud Spaces bucket"
  value       = digitalocean_spaces_bucket.nextcloud.name
}

output "nextcloud_spaces_region" {
  description = "Region of the Nextcloud Spaces bucket"
  value       = digitalocean_spaces_bucket.nextcloud.region
}

output "nextcloud_spaces_endpoint" {
  description = "Endpoint URL for the Nextcloud Spaces bucket"
  value       = "https://${digitalocean_spaces_bucket.nextcloud.region}.digitaloceanspaces.com"
}

output "nextcloud_spaces_bucket_domain" {
  description = "Domain name of the Nextcloud Spaces bucket"
  value       = digitalocean_spaces_bucket.nextcloud.bucket_domain_name
}