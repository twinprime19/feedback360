import moment from 'moment'

export const FORMAT = {
  EN: {
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm:ss',
    DATETIME: 'DD:MM:YYYY HH:mm:ss',
  },
  VI: {
    DATE: 'DD-MM-YYYY',
    DATE2: 'DD/MM/YYYY',
    TIME: 'HH:mm:ss',
  },
}
export const EXPORT_POSTFIX_FORMAT = 'YYMMDDHHmmss'

export function formatTimeDifference(inputDate: string | moment.Moment) {
  const currentDate = moment()
  const inputMoment = moment(inputDate)

  if (!inputMoment.isValid()) {
    return 'Invalid date'
  }

  const duration = moment.duration(currentDate.diff(inputMoment))

  if (duration.as('seconds') < 0) {
    return `just now`
  } else if (duration.as('minutes') < 1) {
    return `1 min`
  } else if (duration.as('hours') < 1) {
    return `${Math.floor(duration.as('minutes'))} min`
  } else if (duration.as('days') < 1 && duration.as('hours') < 2) {
    return `${Math.floor(duration.as('hours'))} hour ago`
  } else if (duration.as('days') < 1) {
    return `${Math.floor(duration.as('hours'))} hours ago`
  } else if (duration.as('days') < 30 && duration.as('days') < 2) {
    return `${Math.floor(duration.as('days'))} day ago`
  } else if (duration.as('days') < 30) {
    return `${Math.floor(duration.as('days'))} days ago`
  } else {
    return inputMoment.format('HH:mm DD/MM/YYYY')
  }
}

export const DateFormatSelections = [
  {
    label: '01-01-2024',
    value: 'DD-MM-YYYY',
  },
  {
    label: '01/01/2024',
    value: 'DD/MM/YYYY',
  },
  {
    label: '2024-01-01',
    value: 'YYYY-MM-DD',
  },
  {
    label: '2024/01/01',
    value: 'YYYY/MM/DD',
  },
  {
    label: 'January 1, 2024',
    value: 'MMMM D, YYYY',
  },
]

export const TimeFormatSelections = [
  {
    label: '01:01:01 AM',
    value: 'HH:mm:ss A',
  },
  {
    label: '01:01:01 am',
    value: 'HH:mm:ss a',
  },
  {
    label: '01:01:01',
    value: 'HH:mm:ss',
  },
]

export const getStartOfWeek = (date: any) => {
  const dayOfWeek = date.day()
  const diff = (dayOfWeek + 6) % 7
  return date.subtract(diff, 'day')
}
