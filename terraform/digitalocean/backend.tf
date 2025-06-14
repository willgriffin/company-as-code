terraform {
  backend "s3" {
    endpoints = {
      s3 = "https://nyc3.digitaloceanspaces.com"
    }
    region                      = "nyc3"
    key                         = "terraform/digitalocean.tfstate"
    # bucket is provided via backend-config in CI/CD
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    # skip_get_ec2_platforms      = true
    skip_s3_checksum            = true
    use_path_style              = true
    
    # These will be provided via backend-config in CI/CD
    # access_key = var.spaces_access_key
    # secret_key = var.spaces_secret_key
  }
}