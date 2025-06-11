# Backup storage infrastructure for disaster recovery
# This creates DigitalOcean Spaces buckets for PostgreSQL and application backups

# Primary backup storage bucket for database and application backups
resource "digitalocean_spaces_bucket" "backup" {
  name   = "${var.cluster_name}-backup"
  region = var.backup_region != null ? var.backup_region : var.region
  acl    = "private"

  # Lifecycle policy for backup retention management
  lifecycle_rule {
    enabled = true
    
    # Keep current backups for specified retention period
    expiration {
      days                         = var.backup_retention_days
      expired_object_delete_marker = true
    }
    
    # Keep non-current versions for shorter period
    noncurrent_version_expiration {
      days = var.backup_version_retention_days
    }
    
    # Archive older backups to reduce costs
    transition {
      days          = var.backup_archive_days
      storage_class = "GLACIER"
    }
  }

  versioning {
    enabled = true
  }
}

# Separate bucket for long-term archival backups (optional)
resource "digitalocean_spaces_bucket" "archive" {
  count  = var.enable_archive_bucket ? 1 : 0
  name   = "${var.cluster_name}-archive"
  region = var.backup_region != null ? var.backup_region : var.region
  acl    = "private"

  lifecycle_rule {
    enabled = true
    
    # Long-term retention for archive
    expiration {
      days                         = var.archive_retention_days
      expired_object_delete_marker = true
    }
  }

  versioning {
    enabled = false  # Archives don't need versioning
  }
}

# Backup bucket policy for restricted access
resource "digitalocean_spaces_bucket_policy" "backup" {
  region = digitalocean_spaces_bucket.backup.region
  bucket = digitalocean_spaces_bucket.backup.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BackupServiceAccess"
        Effect = "Allow"
        Principal = {
          AWS = ["*"]
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "${digitalocean_spaces_bucket.backup.bucket_domain_name}/*",
          digitalocean_spaces_bucket.backup.bucket_domain_name
        ]
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "AES256"
          }
        }
      }
    ]
  })
}