resource "cloudflare_record" "main" {
  zone_id = local.zone_id
  name    = "fm"
  type    = "CNAME"
  proxied = true
  content = "future-memory-reviews.pages.dev"
}
