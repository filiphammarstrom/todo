const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Allow Metro to watch workspace packages (resolves pnpm symlinks)
config.watchFolders = [workspaceRoot]

// Resolve node_modules from both app root and workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Required for @supabase/supabase-js CJS bundles
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs']

// Enable package.json exports field resolution (needed by supabase-js v2)
config.resolver.unstable_enablePackageExports = true

module.exports = config
