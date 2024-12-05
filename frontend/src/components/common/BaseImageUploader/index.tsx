import React, { useEffect, useState } from 'react'
import Upload, { RcFile, UploadChangeParam, UploadFile } from 'antd/lib/upload'
import * as Icon from '@ant-design/icons'
import styles from './style.module.less'
import './style.less'
import { Space, Typography, notification } from 'antd'
import { ResponseError, useUploadMediaMutation } from '@/pages/api'
import { FILE } from '@/config'
import { ThumbnailResponse } from '@/models/file'
import { getFileMBSize } from '@/utils/file'
import { labelText, toastMessages } from '@/constants/messages'

type Props = {
  name?: string
  action?: (id: ThumbnailResponse & { _id: string }) => void
  beforeUpload?: (file: RcFile, FileList: RcFile[]) => any | Promise<any>
  onChange?: (info: UploadChangeParam<UploadFile<any>>) => void
  customRequest?: (options: any) => void
  imgUrl?: string
}

export default (props: Props) => {
  const [uploadImage, { isLoading: isLoadingUpload }] = useUploadMediaMutation()
  const [previewImage, setPreviewImage] = useState(props.imgUrl)

  const uploadFile = (e: any) => {
    const formData = new FormData()
    formData.append('thumbnail', e.file)

    // check giới hạn dung lượng ảnh (nếu có)
    if (getFileMBSize(e.file) < 0 || getFileMBSize(e.file) > FILE.MAX_MB_SIZE) {
      notification.warning({
        message: (
          <Typography.Text
            style={{
              fontSize: 14,
            }}
          >
            {toastMessages.imageMaxSize}
          </Typography.Text>
        ),
      })
      return
    }
    uploadImage(formData)
      .unwrap()
      .then((response) => {
        notification.success({
          message: (
            <Typography.Text
              style={{
                fontSize: 14,
              }}
            >
              {toastMessages.uploadSuccessfully}
            </Typography.Text>
          ),
        })
        if (props.action) {
          props.action(response?.result as ThumbnailResponse & { _id: string })
        }
      })
      .catch((err: ResponseError) => {
        notification.error({
          message: (
            <Typography.Text
              style={{
                fontSize: 14,
              }}
            >
              {err?.data?.message ?? (err.statusText as string) ?? toastMessages.uploadFailed}
            </Typography.Text>
          ),
        })
      })
  }

  useEffect(() => {
    if (props.imgUrl) {
      setPreviewImage(props.imgUrl)
    }
  }, [props.imgUrl])

  return (
    <Space direction="vertical" className={styles.imageUploader}>
      <Upload
        name="thumbnail"
        className={styles.uploader}
        listType="picture-card"
        showUploadList={false}
        beforeUpload={props.beforeUpload}
        onChange={props.onChange}
        customRequest={uploadFile}
        maxCount={1}
      >
        {previewImage && !isLoadingUpload ? (
          <img className={styles.image} src={previewImage} alt={previewImage} />
        ) : (
          <div className={styles.tigger}>
            {isLoadingUpload && <Icon.LoadingOutlined />}
            <p className={styles.uploadText}>
              {isLoadingUpload ? labelText.uploading : labelText.uploadDesc}
            </p>
          </div>
        )}
      </Upload>
    </Space>
  )
}
