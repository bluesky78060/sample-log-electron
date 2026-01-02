const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'sample-log',
    executableName: 'sample-log',
    appBundleId: 'com.samplelog.app',
    extraResource: ['./src/app-update.yml'],
    icon: './assets/icon',
  },
  rebuildConfig: {},
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'bluesky78060',
          name: 'sample-log-electron'
        },
        prerelease: false
      }
    }
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'sample-log',
        setupExe: 'sample-log-setup.exe',
        setupIcon: './assets/icon.ico',
        iconUrl: 'https://raw.githubusercontent.com/bluesky78060/sample-log-electron/main/assets/icon.ico',
        title: '시료접수대장',
        shortcutName: '시료접수대장',
        authors: '봉화군 농업기술센터',
        description: '시료 접수 관리 프로그램'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
