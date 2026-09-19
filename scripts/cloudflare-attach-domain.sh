#!/usr/bin/env bash
# Idempotently prepare a Cloudflare Pages project for a custom domain:
#   1. create the Pages project if it does not exist yet
#   2. attach the domain to the Pages project (no-op if already attached)
#   3. point the DNS record in the zone at <project>.pages.dev (proxied CNAME)
#
# Required env:
#   CLOUDFLARE_API_TOKEN   token with "Account > Cloudflare Pages > Edit"
#                          and "Zone > DNS > Edit" on the zone
#   CLOUDFLARE_ACCOUNT_ID
#   PAGES_PROJECT          e.g. nat-checker
#   CUSTOM_DOMAIN          e.g. nat-checker.kkcloud.org
#   ZONE_NAME              e.g. kkcloud.org
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?}" "${CLOUDFLARE_ACCOUNT_ID:?}"
: "${PAGES_PROJECT:?}" "${CUSTOM_DOMAIN:?}" "${ZONE_NAME:?}"

api() {
  curl -fsS "https://api.cloudflare.com/client/v4$1" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" "${@:2}"
}

echo "==> Ensuring Pages project $PAGES_PROJECT exists"
if api "/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PAGES_PROJECT" >/dev/null 2>&1; then
  echo "    exists"
else
  api "/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects" -X POST \
    --data "$(jq -cn --arg n "$PAGES_PROJECT" '{name: $n, production_branch: "main"}')" >/dev/null
  echo "    created"
fi

echo "==> Attaching $CUSTOM_DOMAIN to Pages project $PAGES_PROJECT"
domains=$(api "/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PAGES_PROJECT/domains")
if echo "$domains" | jq -e --arg d "$CUSTOM_DOMAIN" '.result[] | select(.name == $d)' >/dev/null; then
  echo "    already attached"
else
  api "/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PAGES_PROJECT/domains" \
    -X POST --data "$(jq -cn --arg d "$CUSTOM_DOMAIN" '{name: $d}')" >/dev/null
  echo "    attached"
fi

echo "==> Ensuring DNS: $CUSTOM_DOMAIN CNAME $PAGES_PROJECT.pages.dev"
zone_id=$(api "/zones?name=$ZONE_NAME&status=active" | jq -re '.result[0].id')
target="$PAGES_PROJECT.pages.dev"
body=$(jq -cn --arg n "$CUSTOM_DOMAIN" --arg t "$target" \
  '{type: "CNAME", name: $n, content: $t, proxied: true, ttl: 1}')

existing=$(api "/zones/$zone_id/dns_records?name=$CUSTOM_DOMAIN" | jq -c '.result')
count=$(echo "$existing" | jq 'length')

if [ "$count" -eq 0 ]; then
  api "/zones/$zone_id/dns_records" -X POST --data "$body" >/dev/null
  echo "    created"
elif [ "$count" -eq 1 ] && echo "$existing" | jq -e --arg t "$target" \
  '.[0] | .type == "CNAME" and .content == $t and .proxied == true' >/dev/null; then
  echo "    already correct"
else
  # Replace whatever currently answers for the name (old A/AAAA/CNAME records)
  # with the single proxied CNAME the Pages project needs.
  for id in $(echo "$existing" | jq -r '.[1:][].id'); do
    api "/zones/$zone_id/dns_records/$id" -X DELETE >/dev/null
  done
  first=$(echo "$existing" | jq -r '.[0].id')
  api "/zones/$zone_id/dns_records/$first" -X PUT --data "$body" >/dev/null
  echo "    updated (previous record(s) replaced)"
fi

echo "==> Done: https://$CUSTOM_DOMAIN"
