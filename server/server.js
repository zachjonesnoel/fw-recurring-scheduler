async function updateScheduleEvent(event_name) {
  try {
    let schedule_event = await $schedule.fetch({
      name: event_name
    })
    console.log(schedule_event)
    let updated_date = new Date(schedule_event.schedule_at)
    updated_date.setDate(updated_date.getDate() + schedule_event.data.schedule_frequency)
    console.log("updated datetime", updated_date)
    schedule_event.data.last_updated = new Date().toISOString()
    let res = await $schedule.update({
      name: schedule_event.name,
      data: schedule_event.data,
      schedule_at: updated_date
    })
    console.log(res)
  } catch (e) {
    console.log("Something went wrong during updating schedule event! ", event_name, JSON.stringify(e))
  }
}

async function createOneTimeScheduleEvent(event_name, frequency) {
  let new_schedule_date = new Date()
  new_schedule_date.setDate(new_schedule_date.getDate() + frequency)
  await $schedule.create({
    name: event_name,
    data: {
      "scheduled_event": event_name,
      "schedule_frequency": frequency
    },
    schedule_at: new_schedule_date.toISOString(),
  })
}

exports = {
  onScheduledEventHandler: async function (args) {
    console.log("Schedule event triggered", args)
    try {
      console.log(`${args.event} event in domain ${args.domain} occurred at ${args.timestamp}`)
      let scheduler_invoked = args.data.scheduled_event
      await updateScheduleEvent(args.iparams[scheduler_invoked + "_scheduler"])
    } catch (e) {
      console.log("Something went wrong during schedule event execution! ", JSON.stringify(e))
    }
  },

  onAppInstallCallback: async function (payload) {
    console.log(payload)
    try {
      //creating a recurring daily schedule
      let schedule_date = new Date()
      schedule_date.setHours(schedule_date.getHours() + 5)
      await $schedule.create({
        name: payload.iparams.daily_scheduler,
        schedule_at: schedule_date.toISOString(),
        data: {
          "scheduled_event": "daily"
        },
        repeat: {
          time_unit: "days",
          frequency: 1
        }
      })
      //creating a one time schedule for every 2 days
      createOneTimeScheduleEvent(payload.iparams.two_scheduler, 2)
      //creating a one time schedule for every 3 days
      createOneTimeScheduleEvent(payload.iparams.three_scheduler, 3)
      //creating a one time schedule for every 5 days
      createOneTimeScheduleEvent(payload.iparams.five_scheduler, 5)
    } catch (e) {
      console.log("Something went wrong during install! ", JSON.stringify(e))
    }
  },

  onAppUninstallCallback: async function (payload) {
    try {
      await $schedule.delete({
        name: payload.iparams.daily_scheduler
      })
      await $schedule.delete({
        name: payload.iparams.two_scheduler
      })
      await $schedule.delete({
        name: payload.iparams.three_scheduler
      })
      await $schedule.delete({
        name: payload.iparams.five_scheduler
      })
    } catch (e) {
      console.log("Something went wrong during uninstall! ", JSON.stringify(e))
    }
  }
};
