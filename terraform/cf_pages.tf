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
      owner             = "mitiko"
      repo_name         = "future-memory-reviews"
      production_branch = "main"
    }
  }
}
