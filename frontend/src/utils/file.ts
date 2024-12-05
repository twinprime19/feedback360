import { http, HTTP_METHOD } from '@/services/axiosHelper'
import axios, { AxiosRequestConfig } from 'axios'

export const getFileMBSize = (file: File | undefined | string | Blob) => {
  if (typeof file === 'string') {
    return 0
  }
  if (file) {
    return file.size / 1024 / 1024
  } else {
    return 0
  }
}

export const isValidExtensionFile = (
  file: File | undefined | string | Blob,
  accepts: string[] = ['png', 'jpg', 'jpeg']
) => {
  if (typeof file === 'string') {
    return false
  }

  if (file) {
    const fileExtension = file.type.split('/')?.[1]
    return accepts.includes(fileExtension)
  } else {
    return false
  }
}

export const fileToDataURL = (file: File | string | Blob) => {
  return new Promise((resolve: (data: string) => any, reject) => {
    setTimeout(() => {
      if (typeof file === 'string') {
        return Promise.reject(new Error("File can't be a string"))
      }
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = (event) => {
        const base64 = (event as any).target.result
        resolve(base64)
      }
      reader.readAsDataURL(file)
    }, 200)
  })
}

export const exportFile = (
  path: string,
  fileName: string,
  func?: (value: boolean) => void,
  config?: AxiosRequestConfig
) => {
  func?.(true)
  http
    .request({
      url: path,
      method: HTTP_METHOD.POST,
      responseType: 'blob', // important
      ...config,
    })
    .then((response) => {
      // create file link in browser's memory
      const href = URL.createObjectURL(response.data)
      // create "a" HTML element with href to file & click
      const link = document.createElement('a')
      link.href = href
      link.setAttribute('download', fileName) //or any other extension
      document.body.appendChild(link)
      link.click()

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
    })
    .finally(() => {
      func?.(false)
    })
}

export const downloadPdfFromUrl = async (
  url: string,
  func: (value: boolean) => void,
  name: string
) => {
  func(true)
  axios({
    url,
    method: 'GET',
    responseType: 'blob',
  })
    .then((response) => {
      const fileName = name || 'file.pdf'
      const href = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = href
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
    })
    .finally(() => {
      func(false)
    })
}
