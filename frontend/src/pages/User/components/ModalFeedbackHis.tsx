import React, { useEffect, useState } from 'react'
import { Button, Modal, notification, Table, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import * as Icon from '@ant-design/icons'

import { useDeleteFeedbackMutation, useGetListFeedbackQuery } from '@/pages/Form/apiSlice'
import { labelText, toastMessages } from '@/constants/messages'
import { PAGE_TABLE } from '@/constants/page'
import { FORMAT } from '@/constants/date'
import { getRelationFromVal } from '@/constants/relation'
import { FeedbackType } from '@/pages/Form/model'
import { ResponseError } from '@/pages/api'

interface Props {
  title?: string
  open: boolean
  handleClose: () => void
  form: string | undefined
  width?: number
}

export default function ModalFeedbackHis({
  title,
  open,
  form,
  handleClose,
  width = 1156,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
  } = useGetListFeedbackQuery(
    {
      page: currentPage,
      page_size: PAGE_TABLE.PERPAGE_MODAL,
      form,
    },
    {
      skip: !form,
    }
  )
  const [deleteFeedback, { isLoading: isLoadingDeleteFeedback }] = useDeleteFeedbackMutation()

  const handleDeleteFeedback = (feedback: string) => {
    Modal.confirm({
      title: (
        <Typography.Text
          strong
          style={{
            fontSize: 16,
          }}
        >
          {toastMessages.deleteFeedback}
        </Typography.Text>
      ) as any,
      content: (
        <Typography.Text
          style={{
            fontSize: 14,
          }}
        >
          {toastMessages.deleteContent}
        </Typography.Text>
      ) as any,
      centered: true,
      onOk: () => {
        deleteFeedback(feedback)
          .unwrap()
          .then(() => {
            notification.success({
              message: (
                <Typography.Text
                  style={{
                    fontSize: 14,
                  }}
                >
                  {toastMessages.deleteSuccessfully}
                </Typography.Text>
              ),
            })
            refetch()
            setCurrentPage(1)
          })
          .catch((err: ResponseError) => {
            notification.error({
              message: (
                <Typography.Text
                  style={{
                    fontSize: 14,
                  }}
                >
                  {err?.data?.message ?? err.statusText ?? toastMessages.deleteFailed}
                </Typography.Text>
              ),
            })
          })
      },
      okText: (
        <Typography.Text
          style={{
            fontSize: 14,
            color: 'white',
          }}
        >
          {labelText.deleteOkText}
        </Typography.Text>
      ) as any,
      cancelText: (
        <Typography.Text
          style={{
            fontSize: 14,
          }}
        >
          {labelText.cancelText}
        </Typography.Text>
      ) as any,
    })
  }

  useEffect(() => {
    if (open) refetch()
  }, [open])

  return (
    <Modal
      className="modal-backend"
      title={title}
      confirmLoading={false}
      forceRender
      open={open}
      width={width || 1156}
      onCancel={handleClose}
      centered={true}
      footer={null}
    >
      <Table<FeedbackType>
        className="custom-table"
        scroll={{ x: 'max-content' }}
        dataSource={result?.result?.data}
        bordered
        loading={isLoading || isFetching}
        pagination={
          result && result?.result?.pagination?.total > PAGE_TABLE.PERPAGE_MODAL
            ? {
                current: result?.result?.pagination.current_page,
                pageSize: PAGE_TABLE.PERPAGE_MODAL,
                total: result?.result?.pagination?.total,
                onChange(page) {
                  setCurrentPage(page)
                },
                showSizeChanger: false,
              }
            : false
        }
        columns={[
          {
            title: '#',
            render: (_: any, __: any, index: number) => index + 1,
            fixed: 'left',
          },
          {
            title: labelText.time,
            render: (_: any, item) => (
              <Typography.Text>
                {item.time ? dayjs(item.time).add(7, 'hour').format(FORMAT.EN.DATETIME) : '-'}
              </Typography.Text>
            ),
            fixed: 'left',
          },
          {
            title: labelText.relationship,
            render: (_: any, item) => (
              <Typography.Text>
                {item.relationship !== undefined && item.relationship !== null
                  ? getRelationFromVal(item.relationship)?.name
                  : '-'}
              </Typography.Text>
            ),
            fixed: 'left',
          },
          {
            align: 'right',
            render: (_: any, item) => {
              return (
                <Tooltip title={labelText.delete}>
                  <Button
                    loading={isLoadingDeleteFeedback}
                    size="middle"
                    danger={true}
                    icon={<Icon.DeleteOutlined />}
                    onClick={() => handleDeleteFeedback(item._id)}
                  ></Button>
                </Tooltip>
              )
            },
          },
        ]}
      />
    </Modal>
  )
}
