#!/usr/bin/env bash

# If any command fails, stop immediately
set -e -o pipefail

echo "[1] Linting"
yarn run lint

echo "[2] Removing dist folder"
rm -rf dist/

echo "[3] Updating CHANGELOG"
cd projects/ngqp/core; standard-version --infile ../../../CHANGELOG.md; cd -

echo "[4] Building @ngqp/core"
yarn run core:build:prod

echo "[5] Copy README and LICENSE"
cp README.md dist/ngqp/core
cp LICENSE dist/ngqp/core
