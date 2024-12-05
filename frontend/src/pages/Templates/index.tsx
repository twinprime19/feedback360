/* eslint-disable */
/**
 * @file Tag list page

 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  useDeleteMultipleTemplatesMutation,
  useDeleteTemplateMutation,
  useGetAllTemplatesQuery,
  useUpdateTemplateStatusMutation,
} from './apiSlice'
import { Question, Template } from './model'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  notification,
  Space,
  Switch,
  Table,
  Tooltip,
  Typography,
  Upload,
} from 'antd'
import { ResponseError } from '../api'
import * as Icon from '@ant-design/icons'
import DeleteNav from '@/components/common/DeleteNav'
import { PAGE_TABLE } from '@/constants/page'
import { ResultTypes } from '../Form/model'
import { FormTypes } from '@/models/form'
import { ActiveStatus } from '@/models/status'
import { headerLabel, labelText, toastMessages } from '@/constants/messages'
import { TemplateForm } from './components/Form'
import { debounce } from 'lodash'

export const TemplatesPage = () => {
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
  } = useGetAllTemplatesQuery({
    keyword: keyword || null,
    page: currentPage,
  })
  const [updateTemplateStatus, { isLoading: isLoadingUpdate }] = useUpdateTemplateStatusMutation()

  // state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm<Template>()
  const [data, setData] = useState(result?.result?.data)
  const [formData, setFormData] = useState<Template | undefined>()
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
  const [deleteTemplate, { isLoading: isLoadingDelete }] = useDeleteTemplateMutation()
  const [deleteMultipleTemplates, { isLoading: isLoadingDeleteMultipleTemplates }] =
    useDeleteMultipleTemplatesMutation()

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
  const handleDeleteTemplate = (template: Template) => {
    Modal.confirm({
      title: (
        <Typography.Text
          strong
          style={{
            fontSize: 16,
          }}
        >
          {`${toastMessages.deleteTitle} mẫu này không?`}
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
        deleteTemplate(template._id)
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

  const handleDeleteSelectedTemplates = () => {
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
        deleteMultipleTemplates(selectedRowKeys)
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
  const handleUpdate = (template: Template) => {
    setFormData(template)
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
        title={`Danh sách ${headerLabel.template} (${result?.result?.pagination.total || 0})`}
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
            handleDelete={handleDeleteSelectedTemplates}
          />
        )}
        <Table<Template>
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
              width: '50%',
              render: (_, template) => (
                <Typography.Paragraph
                  ellipsis={{
                    rows: 2,
                  }}
                  style={{
                    maxWidth: 400,
                    lineBreak: 'auto',
                  }}
                >
                  {template?.title || '-'}
                </Typography.Paragraph>
              ),
            },
            {
              title: (
                <Space size={'small'}>
                  <Typography.Text>{labelText.level}</Typography.Text>
                  <Tooltip title={labelText.levelDesc}>
                    <Icon.QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              ),
              dataIndex: 'level',
              align: 'right',
              render: (_, template) => (
                <Typography.Paragraph
                  ellipsis={{
                    rows: 2,
                  }}
                  style={{
                    lineBreak: 'auto',
                    marginBottom: 0,
                    float: 'right',
                  }}
                >
                  {template?.level || 1}
                </Typography.Paragraph>
              ),
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
                          onClick={() => handleDeleteTemplate(template)}
                          loading={isLoadingDelete || isLoadingDeleteMultipleTemplates}
                        ></Button>
                      </Tooltip>
                    </>
                  </Space>
                )
              },
            },
          ]}
        />

        <TemplateForm
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
