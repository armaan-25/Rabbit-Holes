#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist"
ZIP_PATH="$OUT_DIR/rabbit-holes-chrome-extension.zip"
PUBLIC_DOWNLOAD="$ROOT_DIR/web/public/downloads/rabbit-holes-extension.zip"

mkdir -p "$OUT_DIR"
mkdir -p "$(dirname "$PUBLIC_DOWNLOAD")"
rm -f "$ZIP_PATH"

cd "$ROOT_DIR/extension"
zip -r "$ZIP_PATH" . \
  -x '*.DS_Store' \
  -x '__MACOSX/*' \
  -x '*.map'

echo "Packaged extension: $ZIP_PATH"
cp "$ZIP_PATH" "$PUBLIC_DOWNLOAD"
echo "Updated public download: $PUBLIC_DOWNLOAD"
