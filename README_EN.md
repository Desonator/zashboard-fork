# Zashboard Fork

This repository contains a personal fork of [Zashboard](https://github.com/Zephyruso/zashboard), a web dashboard for Clash-compatible cores. Fork-specific changes include Smart proxy-group weight indicators and update checks that point to this repository.

<p align="center">
  <img src="./readme/pc.png" height="300" alt="Zashboard desktop interface">
  <img src="./readme/mobile.png" height="300" alt="Zashboard mobile interface">
</p>

## Browser requirements

- Chrome 111 or newer
- Firefox 128 or newer
- Safari 16.4 or newer
- Jailbroken iOS 16.4 is not supported

## Download and installation

Download `dist.zip` from the [fork's Releases page](https://github.com/Desonator/zashboard-fork/releases). Extract it and serve the contents of the `dist` directory as the external UI for your Clash-compatible core. GitHub Actions builds this installable archive; the source-code archives on the Releases page are not UI packages.

To have the core download this fork when you use its UI upgrade feature, set the core's `external-ui-url` to a release archive from this repository. For example:

```yaml
external-ui: ui
external-ui-url: https://github.com/Desonator/zashboard-fork/releases/latest/download/dist.zip
```

The dashboard checks for releases in this fork. The core downloads the UI archive from `external-ui-url`; changing the dashboard's release check does not change that core setting.

## Smart proxy groups

When the connected core exposes Smart-group weights through its API, the dashboard can show each Smart node's weight and ping in a responsive status row, as well as a weight badge and usage rank on its proxy card. The weight badge uses a restrained color accent based on the rank. Optional settings control this row, sorting Smart groups by usage frequency, and showing the three highest-weight Smart nodes in the proxy chain. These are the top candidates by weight and do not necessarily represent the route used by an individual connection. Weight information requires a core that supports the relevant Smart API and returns the data.

Hovering a Smart weight shows locally recorded weight/rank changes for that backend. The dashboard records a point only when the value changes; it does not add polling. The existing ping tooltip also shows group test details returned by the core, and displays Prizrak-Core's additional `ping-config` status only when the API provides that profile and result. Provider availability and exact update time appear as tooltip details when the core returns those fields.

## Build from source

Requirements: Node.js 22 and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm run build
```

The production files are written to `dist/`. GitHub Actions builds an artifact when changes are pushed to `main`. Pushing a `v*` tag builds a GitHub Release with `dist.zip` attached. See [Actions](https://github.com/Desonator/zashboard-fork/actions) for build status and artifacts.

## Tips

1. Drag the connection table with the left mouse button. Right-click a cell to copy its contents.
2. Right-click a proxy or proxy-group card to run a speed test.
3. Proxy groups are ordered according to their nodes in the `GLOBAL` group, which follows the configuration order. Override `GLOBAL` if you need a custom order.
4. The dashboard supports PWA installation through your browser's “Add to Home Screen” feature.
5. Proxy cards can be displayed in small, medium, or large sizes; the grid adjusts the number of cards per row to fit the available width.

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

## Credits

This fork is based on [Zephyruso/Zashboard](https://github.com/Zephyruso/zashboard). If you would like to donate, please consider supporting [UNICEF](https://www.unicef.org/).
