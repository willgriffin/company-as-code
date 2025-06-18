terraform {
  backend "s3" {
    # Standard AWS S3 backend configuration
    key                         = "terraform/digitalocean.tfstate"
    encrypt                     = true
    
    # These will be provided via backend-config in CI/CD:
    # bucket = var.terraform_state_bucket
    # region = var.terraform_state_region
    # access_key = var.aws_access_key_id
    # secret_key = var.aws_secret_access_key
  }
}