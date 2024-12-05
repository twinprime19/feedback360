/**
 * @file General publish state

 */

export enum DayInWeek {
  Mon = 0,
  Tue = 1,
  Wed = 2,
  Thu = 3,
  Fri = 4,
  Sat = 5,
  Sun = 6,
  All = 7,
}

const dayInWeekMap = new Map(
  [
    {
      id: DayInWeek.All,
      name: 'select-all',
    },
    {
      id: DayInWeek.Mon,
      name: 'monday',
    },
    {
      id: DayInWeek.Tue,
      name: 'tuesday',
    },
    {
      id: DayInWeek.Wed,
      name: 'wednesday',
    },
    {
      id: DayInWeek.Thu,
      name: 'thursday',
    },
    {
      id: DayInWeek.Fri,
      name: 'friday',
    },
    {
      id: DayInWeek.Sat,
      name: 'saturday',
    },
    {
      id: DayInWeek.Sun,
      name: 'sunday',
    },
  ].map((item) => [item.id, item])
)

export const mapIdToNameDay = (day: DayInWeek) => {
  return dayInWeekMap.get(day)!
}

export const dayInWeeks = Array.from<ReturnType<typeof mapIdToNameDay>>(dayInWeekMap.values())

// ---
export enum DateFormat {
  DDMMYYYY = 'DD/MM/YYYY',
  DMY = 'DD-MM-YYYY',
  MDY = 'MM-DD-YYYY',
  YMD = 'YYYY-MM-DD',
  FullMonthDayYear = 'MMMM D, YYYY',
}

export enum DateTimeFormat {
  DMY_HMS = 'DD/MM/YYYY HH:mm:ss',
}

const dayFormatMap = new Map(
  [
    {
      id: DateFormat.DMY,
      name: DateFormat.DMY,
    },
    {
      id: DateFormat.MDY,
      name: DateFormat.MDY,
    },
    {
      id: DateFormat.YMD,
      name: DateFormat.YMD,
    },
  ].map((item) => [item.id, item])
)

export const mapIdToNameDayFormat = (dayFormat: DateFormat) => {
  return dayFormatMap.get(dayFormat)!
}

export const dayFormats = Array.from<ReturnType<typeof mapIdToNameDayFormat>>(
  dayFormatMap.values()
)

//---

export enum TimeFormat {
  '12h' = 'hh:mm:ss A',
  '24h' = 'HH:mm:ss',
  '12h-timezone' = 'hh:mm:ss A Z',
  '24h-timezone' = 'HH:mm:ss Z',
  'Hm' = 'HH:mm',
}
const timeFormatMap = new Map(
  [
    {
      id: TimeFormat['12h'],
      name: TimeFormat['12h'],
    },
    {
      id: TimeFormat['24h'],
      name: TimeFormat['24h'],
    },
    {
      id: TimeFormat['12h-timezone'],
      name: TimeFormat['12h-timezone'],
    },
    {
      id: TimeFormat['24h-timezone'],
      name: TimeFormat['24h-timezone'],
    },
    {
      id: TimeFormat['Hm'],
      name: 'Hour & minute',
    },
  ].map((item) => [item.id, item])
)

export const mapIdToNameTimeFormat = (timeFormat: TimeFormat) => {
  return timeFormatMap.get(timeFormat)!
}

export const timeFormats = Array.from<ReturnType<typeof mapIdToNameTimeFormat>>(
  timeFormatMap.values()
)
