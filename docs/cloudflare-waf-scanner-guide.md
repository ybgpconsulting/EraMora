# Cloudflare WAF scanner-path rule guide

This is a manual dashboard guide. No Cloudflare account or WAF settings were changed.

## Suggested custom rule

In the zone's **Security → WAF → Custom rules**, create a rule named `Block known scanner paths` with this expression:

```text
not starts_with(lower(http.request.uri.path), "/.well-known/")
and (
  lower(http.request.uri.path) eq "/ms-edit.php"
  or lower(http.request.uri.path) eq "/wp-login.php"
  or lower(http.request.uri.path) eq "/xmlrpc.php"
  or lower(http.request.uri.path) eq "/adminer.php"
  or lower(http.request.uri.path) eq "/wp-admin"
  or starts_with(lower(http.request.uri.path), "/wp-admin/")
  or starts_with(lower(http.request.uri.path), "/wp-content/")
  or starts_with(lower(http.request.uri.path), "/wp-includes/")
  or lower(http.request.uri.path) eq "/wp-admin.php"
  or lower(http.request.uri.path) eq "/wp-config.php"
  or starts_with(lower(http.request.uri.path), "/wp-config.php.")
  or lower(http.request.uri.path) eq "/.env"
  or starts_with(lower(http.request.uri.path), "/.env/")
  or starts_with(lower(http.request.uri.path), "/.env.")
  or lower(http.request.uri.path) eq "/.git"
  or starts_with(lower(http.request.uri.path), "/.git/")
  or lower(http.request.uri.path) eq "/phpmyadmin"
  or starts_with(lower(http.request.uri.path), "/phpmyadmin/")
  or lower(http.request.uri.path) eq "/pma"
  or starts_with(lower(http.request.uri.path), "/pma/")
  or lower(http.request.uri.path) eq "/phpinfo.php"
  or lower(http.request.uri.path) eq "/hnap1"
  or lower(http.request.uri.path) eq "/boaform"
  or starts_with(lower(http.request.uri.path), "/boaform/")
  or lower(http.request.uri.path) eq "/cgi-bin"
  or starts_with(lower(http.request.uri.path), "/cgi-bin/")
  or lower(http.request.uri.path) eq "/actuator"
  or starts_with(lower(http.request.uri.path), "/actuator/")
  or lower(http.request.uri.path) eq "/server-status"
  or starts_with(lower(http.request.uri.path), "/vendor/phpunit/")
)
```

The paths cover the observed `/ms-edit.php` probe and common WordPress, environment-file, exposed repository, database-admin, PHP-info, network-device, PHPUnit, CGI, and actuator scanner families. The `/.well-known/` exclusion preserves ACME challenges and other well-known resources.

## Rollout

1. Review the expression against the zone's application routes and current security events.
2. Start with a supported non-blocking action, such as **Log** where available, or a challenge action. Review matched requests for false positives for at least seven days.
3. Confirm that legitimate routes and `/.well-known/` resources are not matched. Add paths shown in Cloudflare Security Events or dashboard Issues only after reviewing them as scanner probes.
4. Change the action to **Block** only after that review. Keep the expression scoped to known probe paths; do not block broad extensions or all unknown URLs.
5. After rollout, monitor security events and application logs, and roll back the action if legitimate traffic is affected.

## Validation checklist

Test the rule in Cloudflare's expression preview and, after deployment, verify that known probes such as `/ms-edit.php`, `/wp-login.php`, `/.env`, `/.git/config`, `/phpmyadmin/`, and `/vendor/phpunit/` are handled as expected. Also verify that `/.well-known/acme-challenge/<token>` and normal storefront routes remain available.

See Cloudflare's [Custom Rules documentation](https://developers.cloudflare.com/waf/custom-rules/) for current dashboard and expression details.
