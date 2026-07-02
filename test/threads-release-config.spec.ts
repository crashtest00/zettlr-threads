import { match } from 'assert'
import packageJson from '../package.json'

describe('Zettlr Threads build configuration', function () {
  it('disables upstream update checks in every Electron Forge build command', function () {
    const forgeBuildScripts = [
      'start',
      'test-gui',
      'package',
      'package:mac-x64',
      'package:mac-arm',
      'package:win-x64',
      'package:win-arm',
      'package:linux-x64',
      'package:linux-arm',
      'release:linux-x64',
      'release:linux-arm'
    ] as const

    for (const name of forgeBuildScripts) {
      match(
        packageJson.scripts[name],
        /\bZETTLR_DISABLE_UPDATE_CHECK=1\b/,
        `${name} must disable upstream update checks`
      )
    }
  })
})
