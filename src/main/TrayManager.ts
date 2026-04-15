import { Tray, Menu, nativeImage, app } from 'electron'
import type { WindowManager } from './WindowManager'

// 16x16 black PNG embedded as base64 — no file path dependency at runtime
const ICON_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAIV0lEQVR4nO3OMQEAMBADoUiv9Mq44UEB' +
  'ewCctDoAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcA' +
  'aKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqr' +
  'AwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAA' +
  'jdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1' +
  'AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCg' +
  'sToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwO' +
  'ANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0' +
  'VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUB' +
  'ABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG' +
  '6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToA' +
  'QGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBY' +
  'HQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcA' +
  'aKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqr' +
  'AwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAA' +
  'jdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1' +
  'AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCg' +
  'sToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwO' +
  'ANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0' +
  'VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUB' +
  'ABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG' +
  '6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToA' +
  'QGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBY' +
  'HQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcA' +
  'aKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqr' +
  'AwA0VgcAaKwOANBYHQCgsToAQGN1AIDG6gAAjdUBABqrAwA0VgcAaKwOAND4rctaAUGhtFoAAAAASUVO' +
  'RK5CYII='

export class TrayManager {
  private tray: Tray

  constructor(wm: WindowManager) {
    const icon = nativeImage.createFromBuffer(Buffer.from(ICON_B64, 'base64'))
    this.tray = new Tray(icon)
    this.tray.setToolTip('Hourly Journal')
    this.buildMenu(wm)
  }

  private buildMenu(wm: WindowManager): void {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Open Settings',
        click: () => wm.showSettings()
      },
      {
        label: 'View Journal Log',
        click: () => wm.showLogViewer()
      },
      { type: 'separator' },
      {
        label: 'Quit Hourly Journal',
        click: () => app.exit(0)
      }
    ])
    this.tray.setContextMenu(menu)
  }
}
