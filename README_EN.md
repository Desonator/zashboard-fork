# Zashboard Fork

This repository contains a personal fork of [Zashboard](https://github.com/Zephyruso/zashboard), a web dashboard for Clash-compatible cores. The fork includes Smart proxy-group weight indicators and fork-specific update checks.

<p align="center">
  <img src="./readme/pc.png" height="300" alt="Zashboard desktop interface">
  <img src="./readme/mobile.png" height="300" alt="Zashboard mobile interface">
</p>

## Browser requirements

- Chrome 111 or newer
- Firefox 128 or newer
- Safari 16.4 or newer
- The jailbroken version of iOS 16.4 is not supported

## Download and installation

Download `dist.zip` from the [fork's Releases page](https://github.com/Desonator/zashboard-fork/releases). Extract the archive and serve the contents of its `dist` directory as the external UI for your Clash-compatible core. The archive is built by GitHub Actions; source archives are not installable UI packages.

To let the core download this fork when you use its UI upgrade feature, point the core configuration at a release archive from this repository. For example:

```yaml
external-ui: ui
external-ui-url: https://github.com/Desonator/zashboard-fork/releases/latest/download/dist.zip
```

The dashboard checks for new releases in this fork. The core's UI upgrade endpoint downloads the URL configured in `external-ui-url`; changing the dashboard's update check does not change that core setting. Use a core that supports the configured UI archive and the Smart group APIs if you want Smart weight information.

## Build from source

Requirements: Node.js 22 and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm run build
```

The production files are written to `dist/`. Pushing to `main` builds an Actions artifact. Pushing a `v*` tag builds a GitHub Release with `dist.zip` attached. See [Actions](https://github.com/Desonator/zashboard-fork/actions) for build status and artifacts.

## Tips

1. Drag the connection table with the left mouse button. Right-click a cell to copy its contents.
2. Right-click a proxy or proxy-group card to run a speed test.
3. Proxy groups are ordered according to their nodes in the `GLOBAL` group, which follows configuration order. Override `GLOBAL` if you need a custom order.
4. The dashboard supports PWA installation through your browser's “Add to Home Screen” feature.
5. Smart group weight information is obtained from the connected core API. It is available only when the core implements the fork's Smart endpoints and returns weight data.

## URL parameters

Basic example:

```text
http://host:port/#/setup?hostname=ipordomain&port=9090&secret=123456
```

- `protocol`: `http` or `https`; defaults to the current page protocol. Legacy `http=1` and `https=1` flags are supported, but `protocol` takes precedence.
- `hostname`: Clash API IP address or domain.
- `port`: Clash API port.
- `secondaryPath`: Optional path appended to the base URL; defaults to empty.
- `secret`: API authentication password.
- `disableUpgradeCore=1`: Hides the core upgrade button.
- `disableTunMode=1`: Hides the TUN switch.

### Automatic backend connection

When no backend has been saved and `hostname` is absent, the dashboard tries the page's origin as the Clash API address. URL parameters such as `secret`, `label`, `type`, `disableUpgradeCore`, and `disableTunMode` are applied to that backend. `protocol` and `port` do not change the detected same-origin address.

For example, with this configuration on `192.168.1.1`:

```yaml
external-ui: ui
external-ui-url: https://github.com/Desonator/zashboard-fork/releases/latest/download/dist.zip
external-controller: 0.0.0.0:9090
secret: ''
```

Opening `http://192.168.1.1:9090/ui` tries to connect to `http://192.168.1.1:9090` and saves the backend if the API responds. If authentication is enabled, pass the secret, for example `http://192.168.1.1:9090/ui?secret=your-secret`.

The dashboard also probes `http://127.0.0.1:9090` with an empty secret as a fallback. The same-origin backend takes priority. If authentication is rejected, the detected address remains in the form so you can enter the secret. If no candidate responds, the form offers `http://127.0.0.1:9090` for manual setup. Editing or submitting the form cancels detection. Saved backends and explicit URL backend parameters keep their existing behavior.

### Support the original project

This fork is based on [Zephyruso/Zashboard](https://github.com/Zephyruso/zashboard). If you would like to donate, please consider supporting [UNICEF](https://www.unicef.org/).
