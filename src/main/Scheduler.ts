import cron from 'node-cron'
import { Notification } from 'electron'
import { getAllPeriods } from './db'
import { buildCronExpression, todayDayOfWeek, formatTime } from '@shared/utils/time'
import type { WindowManager } from './WindowManager'
import type { Period } from '@shared/types/period'

export class Scheduler {
  private tasks = new Map<number, cron.ScheduledTask>()
  private wm: WindowManager

  constructor(wm: WindowManager) {
    this.wm = wm
  }

  start(): void {
    this.reload()
  }

  // Called whenever periods change so cron jobs stay in sync
  reload(): void {
    for(const task of this.tasks.values()) task.stop()
    this.tasks.clear()

    const periods = getAllPeriods().filter((p) => p.active)
    for(const period of periods){
      const expr = buildCronExpression(period.endTime)
      const task = cron.schedule(expr, () => {
        if(!period.days.includes(todayDayOfWeek())) return
        this.trigger(period)
      })
      this.tasks.set(period.id, task)
    }
  }

  private trigger(period: Period): void {
    const data = {
      periodId: period.id,
      periodLabel: period.label,
      start: period.startTime,
      end: period.endTime
    }

    if(Notification.isSupported()){
      const notif = new Notification({
        title: 'Time to Journal',
        body: `Journal your accomplishments from ${formatTime(period.startTime)} to ${formatTime(period.endTime)}. Tap to enter.`
      })
      notif.on('click', () => this.wm.showQuickEntry(data))
      notif.show()
    }

    this.wm.showQuickEntry(data)
  }
}
