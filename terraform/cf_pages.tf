resource "cloudflare_pages_project" "main" {
  account_id        = local.account_id
  name              = "future-memory-reviews"
  production_branch = "main"

  build_config {
    destination_dir = "src"
  }

  source {
    type = "github"

    config {
      owner             = "future-memories"
      repo_name         = "reviews"
      production_branch = "main"
    }
  }

  deployment_configs {
    production {
      secrets = {
        "DISCORD_BOT_TOKEN" = var.discord_bot_token
      }
    }
    preview {
      secrets = {
        "DISCORD_BOT_TOKEN" = var.discord_bot_token
      }
    }
  }
}
