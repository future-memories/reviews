resource "cloudflare_pages_domain" "main" {
  account_id   = local.account_id
  project_name = cloudflare_pages_project.main.name
  domain       = "fm.mitiko.xyz"
}
