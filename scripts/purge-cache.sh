#!/bin/bash
# Purge le cache Cloudflare manuellement
# Usage: ./scripts/purge-cache.sh
#
# Prerequis: configurer les variables d'environnement:
#   export CLOUDFLARE_ZONE_ID="ton_zone_id"
#   export CLOUDFLARE_API_TOKEN="ton_api_token"
# OU les mettre dans .env a la racine du projet

# Charger .env si present
if [ -f "$(dirname "$0")/../.env" ]; then
  source "$(dirname "$0")/../.env"
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Erreur: CLOUDFLARE_ZONE_ID et CLOUDFLARE_API_TOKEN requis"
  echo "Configure-les dans .env ou en variables d'environnement"
  exit 1
fi

echo "Purge du cache Cloudflare..."
RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success','false'))" 2>/dev/null)

if [ "$SUCCESS" = "True" ] || [ "$SUCCESS" = "true" ]; then
  echo "Cache purge avec succes! Le site sera a jour dans ~30 secondes."
else
  echo "Erreur lors de la purge:"
  echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
fi
