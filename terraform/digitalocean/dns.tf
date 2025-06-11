# DigitalOcean Domain Management
# Import existing domain if skip_domain_creation is true
import {
  count = var.skip_domain_creation ? 1 : 0
  to    = digitalocean_domain.imported[0]
  id    = var.primary_domain
}

resource "digitalocean_domain" "imported" {
  count = var.skip_domain_creation ? 1 : 0
  name  = var.primary_domain
}

# Create new domain if not skipping domain creation
resource "digitalocean_domain" "main" {
  count = var.skip_domain_creation ? 0 : 1
  name  = var.primary_domain
}

# Create locals to handle both existing and new domains
locals {
  domain_name = var.primary_domain
  domain_id   = var.skip_domain_creation ? digitalocean_domain.imported[0].id : digitalocean_domain.main[0].id
}


# DNS Records for services
resource "digitalocean_record" "keycloak" {
  domain = local.domain_id
  type   = "A"
  name   = "auth"
  value  = var.load_balancer_ip
  ttl    = 300
}

resource "digitalocean_record" "mattermost" {
  domain = local.domain_id
  type   = "A"
  name   = "chat"
  value  = var.load_balancer_ip
  ttl    = 300
}

resource "digitalocean_record" "nextcloud" {
  domain = local.domain_id
  type   = "A"
  name   = "cloud"
  value  = var.load_balancer_ip
  ttl    = 300
}

resource "digitalocean_record" "mailu" {
  domain = local.domain_id
  type   = "A"
  name   = "mail"
  value  = var.load_balancer_ip
  ttl    = 300
}

# Wildcard record for any additional subdomains
resource "digitalocean_record" "wildcard" {
  domain = local.domain_id
  type   = "A"
  name   = "*"
  value  = var.load_balancer_ip
  ttl    = 300
}

# MX records for Mailu email server
resource "digitalocean_record" "mx_primary" {
  domain   = local.domain_id
  type     = "MX"
  name     = "@"
  value    = "mail.${var.primary_domain}."
  priority = 10
  ttl      = 300
}

resource "digitalocean_record" "mx_mail" {
  domain   = local.domain_id
  type     = "MX"
  name     = "mail"
  value    = "mail.${var.primary_domain}."
  priority = 10
  ttl      = 300
}

# SPF record for email security
resource "digitalocean_record" "spf" {
  domain = local.domain_id
  type   = "TXT"
  name   = "@"
  value  = "v=spf1 include:mail.${var.primary_domain} ~all"
  ttl    = 300
}

# DMARC record for email security
resource "digitalocean_record" "dmarc" {
  domain = local.domain_id
  type   = "TXT"
  name   = "_dmarc"
  value  = "v=DMARC1; p=quarantine; rua=mailto:dmarc@${var.primary_domain}; ruf=mailto:dmarc@${var.primary_domain}"
  ttl    = 300
}

# Output domain information
output "domain_name" {
  description = "The managed domain name"
  value       = local.domain_name
}

output "domain_urn" {
  description = "The uniform resource name of the domain"
  value       = var.skip_domain_creation ? digitalocean_domain.imported[0].urn : digitalocean_domain.main[0].urn
}

output "domain_created" {
  description = "Whether a new domain was created (false if existing domain was used)"
  value       = !var.skip_domain_creation
}

output "load_balancer_ip" {
  description = "External IP address of the cluster load balancer"
  value       = var.load_balancer_ip
}

output "dns_records" {
  description = "DNS records created for services"
  value = {
    keycloak   = "${digitalocean_record.keycloak.name}.${local.domain_name}"
    mattermost = "${digitalocean_record.mattermost.name}.${local.domain_name}"
    nextcloud  = "${digitalocean_record.nextcloud.name}.${local.domain_name}"
    mailu      = "${digitalocean_record.mailu.name}.${local.domain_name}"
  }
}