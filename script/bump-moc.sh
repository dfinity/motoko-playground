#!/usr/bin/env bash

MOC_VERSION=$1

echo upgrading '`moc`' to $MOC_VERSION
echo

perl -pi -e "s/MOC_VERSION = \"[0-9\.]+\"/MOC_VERSION = \"$MOC_VERSION\"/g" src/App.tsx

curl -L https://github.com/dfinity/motoko/releases/download/${MOC_VERSION}/moc-${MOC_VERSION}.js \
  > public/moc.js

git add src/App.tsx public/moc.js

