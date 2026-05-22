const store = require('./store');
const whatsapp = require('./whatsapp');

const WEEK_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const GRACE_MINUTES = 10;
const loggedTransientFailures = new Set();

function localParts(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short'
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    minutes: toMinutes(`${parts.hour}:${parts.minute}`),
    day: WEEK_DAYS[dateForWeekday(parts.weekday)]
  };
}

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function dateForWeekday(shortWeekday) {
  const map = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return map[shortWeekday];
}

function formatBotMessage(schedule) {
  const botName = schedule.botName || 'SuperVISOR';
  return `*${botName}*:\n${schedule.message}`;
}

function scheduleMatchesDate(schedule, now) {
  const mode = schedule.scheduleMode || 'weekly';

  if (mode === 'dates') {
    return Array.isArray(schedule.specificDates) && schedule.specificDates.includes(now.date);
  }

  return Array.isArray(schedule.days) && schedule.days.includes(now.day);
}

async function runDueSchedules() {
  const now = localParts(new Date());
  const schedules = await store.listSchedules();

  for (const schedule of schedules) {
    const scheduledMinutes = toMinutes(schedule.time);
    const runKey = `${now.date} ${schedule.time}`;
    const shouldRun =
      schedule.active &&
      scheduleMatchesDate(schedule, now) &&
      now.minutes >= scheduledMinutes &&
      now.minutes <= scheduledMinutes + GRACE_MINUTES &&
      schedule.lastRunKey !== runKey;

    if (!shouldRun) continue;

    try {
      const results = await whatsapp.sendMessageToGroups(schedule.groupIds, formatBotMessage(schedule));
      await store.markScheduleRun(schedule.id, runKey);
      loggedTransientFailures.delete(`${schedule.id}:${runKey}`);
      await store.addSendLog({
        scheduleId: schedule.id,
        scheduleTitle: schedule.title,
        results,
        status: results.every((result) => result.ok) ? 'sent' : 'partial'
      });
    } catch (error) {
      const isTemporaryConnectionError =
        error.status === 409 || error.message.includes('WhatsApp ainda não está conectado');
      const failureKey = `${schedule.id}:${runKey}`;

      if (!isTemporaryConnectionError) {
        await store.markScheduleRun(schedule.id, runKey);
      }

      if (isTemporaryConnectionError && loggedTransientFailures.has(failureKey)) {
        continue;
      }

      loggedTransientFailures.add(failureKey);
      await store.addSendLog({
        scheduleId: schedule.id,
        scheduleTitle: schedule.title,
        status: 'failed',
        error: error.message
      });
    }
  }
}

function startScheduler() {
  setInterval(runDueSchedules, 30 * 1000);
  runDueSchedules();
}

module.exports = {
  runDueSchedules,
  startScheduler
};
