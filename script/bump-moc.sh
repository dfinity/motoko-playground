#!/usr/bin/env bash

MOC_VERSION=$1

echo upgrading '`moc`' to $MOC_VERSION
echo

git switch main && git pull

perl -pi -e "s/MOC_VERSION = \"[0-9\.]+\"/MOC_VERSION = \"$MOC_VERSION\"/g" src/App.tsx

echo '`public/moc.js`' before
ls -l public/moc.js
curl -L https://github.com/dfinity/motoko/releases/download/${MOC_VERSION}/moc-${MOC_VERSION}.js \
  > public/moc.js
echo '`public/moc.js`' after bump
ls -l public/moc.js

git add src/App.tsx public/moc.js
git switch -c bump/moc-$MOC_VERSION
git status -uno
git diff --staged src/App.tsx
git commit -m 'chore: bump moc to v'$MOC_VERSION
git push -u origin bump/moc-$MOC_VERSION
echo Create PR by
echo 'open https://github.com/dfinity/motoko-playground/pull/new/bump/moc-'$MOC_VERSION

