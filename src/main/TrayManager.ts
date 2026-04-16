import { Tray, nativeImage, app } from 'electron'
import { join } from 'path'
import type { WindowManager } from './WindowManager'

export class TrayManager {
  private tray: Tray

  constructor(wm: WindowManager) {
    const iconPath = join(app.getAppPath(), 'build/tray-icon.png')
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    icon.setTemplateImage(true)
    this.tray = new Tray(icon)
    this.tray.setToolTip('computerjournal')
    this.tray.on('click', () => wm.showMain())
  }
}
