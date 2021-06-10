#!/usr/bin/env node

const path = require('path')
const { existsSync } = require('fs')
const { execSync } = require('child_process')
const { aliases } = require('./generateAliases')

const reactAppTypesFilePath = path.join(
  process.cwd(),
  'src',
  'react-app-env.d.ts'
)

if (existsSync(reactAppTypesFilePath)) {
  console.info(`Removing existing 'react-app-env.d.ts'...`)
  execSync(`rm ${reactAppTypesFilePath}`)
}

Object.values(aliases).forEach((canisterPath) => {
  const didPath = canisterPath.replace(/\.js$/, '.d.ts')

  console.info(`Replacing with ${didPath}...`)
  execSync(`mv ${didPath} ${reactAppTypesFilePath}`)
})
