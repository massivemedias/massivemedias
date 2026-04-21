#!/bin/bash
# Generate static index.html copies for all SPA routes
# so GitHub Pages returns 200 instead of 404 (critical for SEO/Google indexing)

DIST="frontend/dist"

# All static routes (excluding / which already has index.html)
ROUTES=(
  "services/prints"
  "services/stickers"
  "services/merch"
  "services/design"
  "services/web"
  "services/impression-fine-art"
  "services/flyers-cartes"
  "services/stickers-custom"
  "services/sublimation-merch"
  "services/design-graphique"
  "services/developpement-web"
  "boutique"
  "boutique/fine-art"
  "boutique/stickers"
  "boutique/sublimation"
  "boutique/flyers"
  "boutique/design"
  "boutique/web"
  "boutique/merch/tshirt"
  "boutique/merch/hoodie"
  "boutique/merch/longsleeve"
  "boutique/merch-tshirt"
  "contact"
  "a-propos"
  "news"
  "tarifs"
  "artistes"
  "artistes/maudite-machine"
  "artistes/psyqu33n"
  "artistes/adrift"
  "artistes/mok"
  "panier"
  "login"
  "checkout"
  "checkout/success"
  "checkout/cancel"
)

COUNT=0
for route in "${ROUTES[@]}"; do
  mkdir -p "$DIST/$route"
  cp "$DIST/index.html" "$DIST/$route/index.html"
  COUNT=$((COUNT + 1))
done

echo "SPA routes: $COUNT index.html copies generated"
