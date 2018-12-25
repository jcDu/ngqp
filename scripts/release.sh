#!/usr/bin/env bash

yarn run lint || exit 1

rm -rf dist/
yarn run changelog:build || exit 1
yarn run core:build || exit 1
yarn run schematics:build || exit 1

cd dist/ngqp/core
npm publish