#!/bin/sh
# fingerprint css/js into index.html so a deploy is never hidden behind a stale cache
cd "$(dirname "$0")"
CSS=$(md5 -q css/main.css | cut -c1-8)
JS=$(md5 -q js/main.js | cut -c1-8)
sed -i '' -E "s|(href=\"css/main\.css)(\?v=[a-f0-9]+)?\"|\1?v=$CSS\"|" index.html
sed -i '' -E "s|(src=\"js/main\.js)(\?v=[a-f0-9]+)?\"|\1?v=$JS\"|" index.html
echo "stamped css=$CSS js=$JS"
