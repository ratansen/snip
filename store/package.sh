#!/bin/sh
# Builds the Chrome Web Store upload zip: dist/snip-<version>.zip
set -e
cd "$(dirname "$0")/.."

version=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json)
out="dist/snip-$version.zip"

mkdir -p dist
rm -f "$out"
zip -q -X -r "$out" manifest.json content.js popup.html popup.js icons -x '*.DS_Store'
echo "$out"
unzip -l "$out"
