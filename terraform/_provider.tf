terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~>4.44.0"
    }
  }
  # init with `tf init -backend-config=main.tfbackend`
  backend "s3" {}
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

locals {
  account_id = "271d70c872fc142477a92de255c0a75a"
  zone_id    = "b1df4c83881b1414bff6c99c5bc9b31e"
}
