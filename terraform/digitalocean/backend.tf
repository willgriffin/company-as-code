terraform {
  backend "s3" {
    endpoint                    = "https://nyc3.digitaloceanspaces.com"
    region                      = "us-east-1"
    key                         = "terraform/digitalocean.tfstate"
    bucket                      = "happyvertical-terraform-state"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_get_ec2_platforms      = true
    skip_s3_checksum            = true
    force_path_style            = true
    
    # These will be provided via backend-config in CI/CD
    # access_key = var.spaces_access_key
    # secret_key = var.spaces_secret_key
  }
}