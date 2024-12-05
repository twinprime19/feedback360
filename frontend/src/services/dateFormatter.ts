import { DateFormatSelections, FORMAT } from '@/constants/date'
import dayjs from 'dayjs'

export const DateFormatter = (dateString: string) => {
  const dateFormat = FORMAT.EN.DATE
  const possibleFormats = DateFormatSelections.map((item) => item.value)
  // Tìm định dạng phù hợp và phân tích chuỗi thời gian
  let parsedDate = null
  for (const format of possibleFormats) {
    parsedDate = dayjs(dateString, format, true)
    if (parsedDate.isValid()) {
      break
    }
  }
  if (parsedDate) {
    return parsedDate.format(dateFormat)
  }
  return dateString
}
