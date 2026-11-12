#!/usr/bin/env bash
# Arma la carpeta _site con los archivos que se publican en GitHub Pages.
# Uso: scripts/build-site.sh <identificador-de-build>
set -euo pipefail
BUILD="${1:-local}"
rm -rf _site && mkdir -p _site
cp index.html styles.css app.js version.js _site/
# Versión y commit visibles en la app
echo "window.APP_BUILD = '${BUILD}';" >> _site/version.js
# Evita que el navegador use archivos viejos después de publicar
sed -i "s#href=\"styles.css\"#href=\"styles.css?v=${BUILD}\"#; s#src=\"version.js\"#src=\"version.js?v=${BUILD}\"#; s#src=\"app.js\"#src=\"app.js?v=${BUILD}\"#" _site/index.html
touch _site/.nojekyll
echo "Sitio listo en _site (build ${BUILD})"
