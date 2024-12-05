/* eslint-disable */
/**
 * @file Tag list page

 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Input,
  Modal,
  notification,
  Space,
  Switch,
  Table,
  Tooltip,
  Typography,
} from 'antd'
import * as Icon from '@ant-design/icons'

import {
  useDeleteMultipleQuestionsMutation,
  useDeleteQuestionMutation,
  useGetAllQuestionsQuery,
  useUpdateQuestionStatusMutation,
} from './apiSlice'
import { Question } from './model'
import { ResponseError } from '../api'
import DeleteNav from '@/components/common/DeleteNav'
import { PAGE_TABLE } from '@/constants/page'
import { ResultTypes } from '../Form/model'
import { QuestionForm } from './components/Form'
import { FormTypes } from '@/models/form'
import { ActiveStatus } from '@/models/status'
import { headerLabel, labelText, toastMessages } from '@/constants/messages'
import { debounce } from 'lodash'

export const QuestionsPage = () => {
  // states
  const [currentPage, setCurrentPage] = useState(1)
  const [keyword, setKeyword] = useState<string>()

  // query api
  const {
    data: result,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllQuestionsQuery({
    keyword: keyword || null,
    page: currentPage,
  })
  const [updateQuestionStatus, { isLoading: isLoadingUpdate }] = useUpdateQuestionStatusMutation()

  // state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [data, setData] = useState(result?.result?.data)
  const [formData, setFormData] = useState<Question | undefined>()
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
  const [deleteQuestion, { isLoading: isLoadingDelete }] = useDeleteQuestionMutation()
  const [deleteMultipleQuestions, { isLoading: isLoadingDeleteMultipleQuestions }] =
    useDeleteMultipleQuestionsMutation()

  const debouncedChangeHandler = useCallback(
    debounce((newKeyword: string) => {
      setKeyword(newKeyword)
    }, PAGE_TABLE.DEBOUNCE_DELAY),
    []
  )

  const handleInputChange = (newKeyword: string) => {
    debouncedChangeHandler(newKeyword)
  }

  // delete
  const handleDeleteQuestion = (question: Question) => {
    Modal.confirm({
      title: (
        <Typography.Text
          strong
          style={{
            fontSize: 16,
          }}
        >
          {`${toastMessages.deleteTitle} câu hỏi này không?`}
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
        deleteQuestion(question._id)
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

  const handleDeleteSelectedQuestions = () => {
    if (selectedRowKeys.length === 0) {
      return
    }
    Modal.confirm({
      title: (
        <Typography.Text
          strong
          style={{
            fontSize: 16,
          }}
        >
          {`${labelText.delete} ${selectedRowKeys.length} ${labelText.item}`}
        </Typography.Text>
      ) as any,
      content: (
        <Typography.Text
          style={{
            fontSize: 14,
          }}
        >
          {toastMessages.deleteMultipleContent}
        </Typography.Text>
      ) as any,
      centered: true,
      onOk: () => {
        deleteMultipleQuestions(selectedRowKeys)
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
        setSelectedRowKeys([])
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

  //update
  const handleUpdate = (question: Question) => {
    setFormData(question)
    handleOpenModal()
  }
  //handle modal
  const handleOpenModal = () => {
    setIsOpenModal(true)
  }
  const handleCloseModal = () => {
    setIsOpenModal(false)
    setFormData(undefined)
  }

  //handle get error
  useEffect(() => {
    if (isError) {
      notification.error({
        message: (
          <Typography.Text
            style={{
              fontSize: 14,
            }}
          >
            {(error as ResponseError)?.statusText}
          </Typography.Text>
        ),
      })
    }

    return () => {
      setSelectedRowKeys([])
      setData(undefined)
    }
  }, [isError])

  return (
    <>
      <Card
        title={`Danh sách ${headerLabel.question} (${result?.result?.pagination.total || 0})`}
        extra={
          <Button type="primary" icon={<Icon.PlusOutlined />} onClick={handleOpenModal}>
            {labelText.addNewText}
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space direction="vertical" size="small" wrap>
            <Space wrap>
              <Input
                style={{ width: 300 }}
                placeholder={labelText.search}
                allowClear
                onChange={(event) => {
                  handleInputChange(event.target.value)
                }}
                value={keyword}
              ></Input>
            </Space>
          </Space>
        </Space>
        {/* <Divider /> */}
        {selectedRowKeys.length > 0 && (
          <DeleteNav
            countItem={selectedRowKeys.length}
            handleDelete={handleDeleteSelectedQuestions}
          />
        )}
        <Table<Question>
          rowKey="id"
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          loading={isLoading || isFetching}
          dataSource={data || result?.result?.data}
          pagination={
            result && result?.result.pagination.total > PAGE_TABLE.PERPAGE
              ? {
                  current: result?.result.pagination.current_page,
                  pageSize: result?.result.pagination.page_size ?? PAGE_TABLE.PERPAGE,
                  total: result?.result.pagination.total,
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
              render: (_, __, index) => index + 1,
            },
            {
              title: labelText.title,
              dataIndex: 'title',
              width: '30%',
              render: (_, question) => (
                <Typography.Paragraph
                  ellipsis={{
                    rows: 2,
                  }}
                  style={{
                    maxWidth: 400,
                    lineBreak: 'auto',
                  }}
                >
                  {question?.title || '-'}
                </Typography.Paragraph>
              ),
            },
            {
              title: labelText.content,
              dataIndex: 'content',
              width: '30%',
              render: (_, question) => (
                <div
                  style={{
                    maxWidth: 400,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 5, // Giới hạn 5 dòng
                    WebkitBoxOrient: 'vertical',
                    lineBreak: 'auto',
                    textOverflow: 'ellipsis',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: (question?.content || '-').replace(/\n/g, '<br />'),
                  }}
                ></div>
              ),
            },
            {
              title: labelText.type,
              dataIndex: 'type',
              render: (_, question) => (
                <Typography.Text ellipsis style={{ width: 120 }}>
                  {question.type === ResultTypes.POINT ? 'Thang điểm' : 'Tự do'}
                </Typography.Text>
              ),
            },
            {
              title: labelText.status,
              dataIndex: 'status',
              sorter: false,
              render: (_, question) => {
                return (
                  <Space direction="vertical" style={{ width: 60 }}>
                    <Switch
                      loading={isLoadingUpdate}
                      onChange={(e) => {
                        updateQuestionStatus({
                          status: e ? ActiveStatus.Active : ActiveStatus.Inactive,
                          _id: question._id,
                        })
                          .unwrap()
                          .then(() => {
                            notification.success({
                              message: (
                                <Typography.Text
                                  style={{
                                    fontSize: 14,
                                  }}
                                >
                                  {toastMessages.updateSuccessfully}
                                </Typography.Text>
                              ),
                            })

                            refetch()
                          })
                          .catch((err: ResponseError) => {
                            notification.error({
                              message: (
                                <Typography.Text
                                  style={{
                                    fontSize: 14,
                                  }}
                                >
                                  {err?.data?.message ??
                                    err.statusText ??
                                    toastMessages.updateFailed}
                                </Typography.Text>
                              ),
                            })
                          })
                      }}
                      checked={!!question.status}
                    />
                  </Space>
                )
              },
            },
            {
              align: 'right',
              render: (_, template) => {
                return (
                  <Space direction="horizontal">
                    <>
                      <Tooltip title={labelText.update}>
                        <Button
                          loading={false}
                          size="middle"
                          icon={<Icon.EditOutlined />}
                          onClick={() => handleUpdate(template)}
                        ></Button>
                      </Tooltip>
                      <Tooltip title={labelText.delete}>
                        <Button
                          size="middle"
                          danger={true}
                          icon={<Icon.DeleteOutlined />}
                          onClick={() => handleDeleteQuestion(template)}
                          loading={isLoadingDelete || isLoadingDeleteMultipleQuestions}
                        ></Button>
                      </Tooltip>
                    </>
                  </Space>
                )
              },
            },
          ]}
        />

        <QuestionForm
          title={formData ? labelText.update : labelText.addNewText}
          open={isOpenModal}
          formData={formData}
          onDone={handleCloseModal}
          onCancel={handleCloseModal}
          formType={formData ? FormTypes.UPDATE : FormTypes.CREATE}
        />
      </Card>
    </>
  )
}
