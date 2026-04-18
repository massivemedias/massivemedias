#!/usr/bin/env bash
# Regle manuellement la commande Cindy (cs_live_a1JARsquWBDKszxRGd6aEi, 40.82$)
# via l'endpoint de reconciliation Stripe.
#
# Usage:
#   RECONCILE_TOKEN=xxxxxxxx ./scripts/reconcile-order-cindy.sh
#
# Le token doit etre celui configure comme env var RECONCILE_TOKEN sur Render.

set -euo pipefail

if [ -z "${RECONCILE_TOKEN:-}" ]; then
  echo "ERREUR: RECONCILE_TOKEN pas defini."
  echo "Usage: RECONCILE_TOKEN=xxx $0"
  echo ""
  echo "Pour le recuperer ou le creer:"
  echo "  1. Render dashboard -> massivemedias-api -> Environment"
  echo "  2. Si RECONCILE_TOKEN n'existe pas, ajouter: RECONCILE_TOKEN=<generer un uuid>"
  echo "  3. Ajouter aussi sur GitHub: Settings > Secrets > RECONCILE_TOKEN"
  exit 1
fi

SESSION_ID="cs_live_a1JARsquWBDKszxRGd6aEi"
URL="https://massivemedias-api.onrender.com/api/orders/reconcile-stripe?sessionId=${SESSION_ID}"

echo "Reconciliation de la commande Cindy ($SESSION_ID)..."
echo ""

RESPONSE=$(curl -sS -X POST \
  -H "Authorization: Bearer ${RECONCILE_TOKEN}" \
  -H "Content-Type: application/json" \
  "$URL")

echo "Reponse du serveur:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Parser le resultat
FIXED=$(echo "$RESPONSE" | jq -r '.fixed | length' 2>/dev/null || echo "0")

if [ "$FIXED" = "1" ]; then
  INVOICE=$(echo "$RESPONSE" | jq -r '.fixed[0].invoice')
  TOTAL=$(echo "$RESPONSE" | jq -r '.fixed[0].total')
  echo "✅ SUCCES: commande passee en paid, facture $INVOICE, total $(($TOTAL / 100)).$(($TOTAL % 100))$"
  echo "   Cindy a recu son email de confirmation."
  echo "   Toi tu as recu la notification de vente."
else
  echo "⚠️  Rien n'a ete corrige. Reponse complete ci-dessus."
  echo "   Cause probable: la session Stripe n'est pas en 'paid' (encore 'unpaid' ou 'expired')."
  echo "   Verifie sur Stripe dashboard: https://dashboard.stripe.com/payments/$SESSION_ID"
fi
