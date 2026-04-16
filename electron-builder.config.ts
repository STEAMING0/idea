import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.computerjournal.app',
  productName: 'computerjournal',
  directories: {
    buildResources: 'build',
    output: 'release'
  },
  files: ['out/**/*'],
  // Native modules (better-sqlite3) must be rebuilt for Electron's Node version
  npmRebuild: true,
  mac: {
    category: 'public.app-category.productivity',
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
    // Set to your Apple Developer ID for production codesigning
    // identity: 'Developer ID Application: Your Name (TEAMID)'
  },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }]
  },
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] }
    ],
    category: 'Office'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  }
}

export default config