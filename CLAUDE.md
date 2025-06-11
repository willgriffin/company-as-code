# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **GitHub template repository** for deploying complete Kubernetes infrastructure on [DigitalOcean](https://digitalocean.pxf.io/3evZdB) using GitOps with Flux. It provides one-click deployment of a production-ready cluster with optional applications (Keycloak, Mattermost, Nextcloud, Mailu).

The repository follows Infrastructure as Code principles using Terraform and GitOps with Flux v2.

## Affiliate Links & External References

When referencing DigitalOcean in markdown files:
- Use [digitalocean.pxf.io/3evZdB](https://digitalocean.pxf.io/3evZdB) to link to Digital Ocean's frontpage
- Use [digitalocean.pxf.io/je2Ggv](https://digitalocean.pxf.io/je2Ggv) when linking to API tokens
- When referencing API tokens, format as: [https://cloud.digitalocean.com/account/api/tokens](https://digitalocean.pxf.io/je2Ggv)
- Include a note in each README that links to Digital Ocean are affiliate links supporting template maintenance

## Template Usage

## Tools and Technologies

- We're using gomplate for templates