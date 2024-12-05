/**
 * @file Tag list page

 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  Table,
  Button,
  Card,
  Space,
  notification,
  Typography,
  Tooltip,
  Modal,
  Switch,
  Dropdown,
  MenuProps,
  Upload,
  Input,
  Tag,
} from 'antd'
import * as Icon from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import styles from './style.module.less'
import './styles.less'
import { PAGE_TABLE } from '@/constants/page'
import { RouteKey, rc } from '@/routes'
import { ResponseError } from '@/pages/api'
import DeleteNav from '../../components/common/DeleteNav'

import { User } from './model'
import { ActiveStatus } from '@/models/status'
import { API_URL, APP_LAYOUT_GUTTER_SIZE_20, BASE_PATH, TEMPLATE_ID } from '@/config'
import {
  useDeleteMultipleUsersMutation,
  useDeleteUserMutation,
  useGetIndexUserQuery,
  useImportUserMutation,
  useUpdateUserStatusMutation,
} from './apiSlice'
import { headerLabel, labelText, toastMessages } from '@/constants/messages'
import { useAddFormForUserMutation } from '../Form/apiSlice'
import { downloadPdfFromUrl, exportFile } from '@/utils/file'
import { SendEmailForm } from './components/SendEmailForm'
import { useDeviceType } from '@/hooks/useDeviceType'
import ModalHelper from '@/components/common/ModalHelper'
import { generateEndpointVersionning } from '@/utils/api'
import { buildQueryFromObject, removeNullish } from '@/services/axiosHelper'
import { EXPORT_POSTFIX_FORMAT, FORMAT } from '@/constants/date'
import dayjs from 'dayjs'
import moment from 'moment'
import ModalSendMailHis from './components/ModalSendMailHis'
import { getMailSendingStatus, MailSendingStatus } from '@/models/emailSendingStatus'
import { LogData } from '../Form/model'
import ModalFeedbackHis from './components/ModalFeedbackHis'
import { debounce } from 'lodash'

export const UserPage = () => {
  // hooks
  const navigate = useNavigate()
  const { isMobile, isTablet } = useDeviceType()

  // states
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
  const [formData, setFormData] = useState<User | undefined>()
  const [isOpenModalHelper, setIsOpenModalHelper] = useState<boolean>(false)
  const [isOpenModalSendMailHis, setIsOpenModalSendMailHis] = useState<boolean>(false)
  const [isLoadingExport, setIsLoadingExport] = useState(false)

  // const [status, setStatus] = useState<ActiveStatus | null>()
  const [keyword, setKeyword] = useState<string>()
  const [selectedDataLogs, setSelectedDataLogs] = useState<LogData[]>([])
  const [selectedForm, setSelectedForm] = useState<string | undefined>(undefined)
  const [isOpenModalFeedbackHis, setIsOpenModalFeedbackHis] = useState<boolean>(false)

  // query api
  const {
    data: result,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetIndexUserQuery({
    page: currentPage,
    // status,
    keyword: keyword || null,
  })
  const dataTable = result?.result?.data

  const [updateUserStatus, { isLoading: isLoadingUpdateUserStatus }] =
    useUpdateUserStatusMutation()
  const [deleteUser, { isLoading: isLoadingDeleteUser }] = useDeleteUserMutation()
  const [deleteMultipleUsers, { isLoading: isLoadingDeleteMultipleUsers }] =
    useDeleteMultipleUsersMutation()
  const [addFormForUser, { isLoading: isLoadingAddForm }] = useAddFormForUserMutation()
  const [importUser, { isLoading: isLoadingImport }] = useImportUserMutation()

  // const [
  //   getStatisticsFormPdf,
  //   { isLoading: isLoadingGetStatisticsFormPdf, isFetching: isFetchingGetStatisticsFormPdf },
  // ] = useLazyGetStatisticsFormPdfQuery()

  // state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [data, setData] = useState(dataTable)

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
  const handleDeleteUser = (user: User) => {
    Modal.confirm({
      title: (
        <Typography.Text
          strong
          style={{
            fontSize: 16,
          }}
        >
          {`${toastMessages.deleteTitle} ${user?.fullname || ''}?` as string}
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
        deleteUser(user.id)
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

  const handleDeleteSelectedUsers = () => {
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
        deleteMultipleUsers(selectedRowKeys)
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

  // add a form for user
  const handleAddFormForUser = (userId: string) => {
    addFormForUser({
      template: TEMPLATE_ID,
      user: userId,
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
              {toastMessages.addSuccessfully}
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
              {err?.data?.message ?? err.statusText ?? toastMessages.addFailed}
            </Typography.Text>
          ),
        })
      })
  }

  // imnport
  const handleImportUser = (e: any) => {
    const formData = new FormData()
    formData.append('file', e.file)
    importUser(formData)
      .unwrap()
      .then(() =>
        notification.success({
          message: (
            <Typography.Text
              style={{
                fontSize: 14,
              }}
            >
              {toastMessages.importSuccessfully}
            </Typography.Text>
          ),
        })
      )
      .catch((err: ResponseError) => {
        notification.error({
          message: (
            <Typography.Text
              style={{
                fontSize: 14,
              }}
            >
              {err?.data?.message ?? err.statusText ?? toastMessages.importFailed}
            </Typography.Text>
          ),
        })
      })
  }

  //export
  const handleExportUser = () => {
    exportFile(
      generateEndpointVersionning({
        endpoint: `/user/export?${buildQueryFromObject(removeNullish({}))}`,
      }),
      `UserData${dayjs().format(EXPORT_POSTFIX_FORMAT)}`,
      (value) => setIsLoadingExport(value)
    )
  }

  const handleGetStatistic = (user: User) => {
    const now = moment()
    const fileName = `${user.fullname} ${now.format('HHmm')} ${now.format(FORMAT.VI.DATE)}.pdf`
    downloadPdfFromUrl(
      `${API_URL}v1.0/form/statistic/${user.forms?.[0]._id}`,
      (value) => setIsExporting(value),
      fileName
    )
  }

  const handleOpenModalHelper = () => {
    setIsOpenModalHelper(true)
  }
  const handleDownloadTemplate = () => {
    window.open('/sampleFiles/UserData_Sample.xlsx', '_blank', 'noreferrer')
  }

  //update
  const handleSendEmail = (user: User) => {
    setFormData(user)
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

  const handleOpenModalSendMailHis = (log: LogData[]) => {
    setSelectedDataLogs(log || [])
    setIsOpenModalSendMailHis(true)
  }

  const handleCloseModalSendMailHis = () => {
    setIsOpenModalSendMailHis(false)
    setSelectedDataLogs([])
  }

  const handleOpenModalFeedbackHis = (form: string) => {
    setSelectedForm(form)
    setIsOpenModalFeedbackHis(true)
  }

  const handleCloseModalFeedbackHis = () => {
    setIsOpenModalFeedbackHis(false)
    setSelectedForm(undefined)
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

  // menu item
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Tooltip title={labelText.uploadUserDataGuider}>
          <Button
            size="small"
            shape="circle"
            icon={<Icon.QuestionOutlined />}
            onClick={handleOpenModalHelper}
          />
        </Tooltip>
      ),
    },
    {
      key: '2',
      label: (
        <Upload
          showUploadList={false}
          customRequest={(e) => {
            const formData = new FormData()
            formData.append('file', e.file)
            // importCategory(formData)
            //   .unwrap()
            //   .catch((err: ResponseError) => {
            //     notification.error({
            //       message: err?.data?.error ?? err.statusText,
            //     })
            //   })
          }}
        >
          <Button
            type="primary"
            icon={<Icon.UploadOutlined />}
            loading={isLoadingImport}
            className={styles.primaryButton}
            style={{ width: '100%' }}
          >
            {labelText.import}
          </Button>
        </Upload>
      ),
    },
    {
      key: '2',
      label: (
        <Button
          type="primary"
          icon={<Icon.DownloadOutlined />}
          onClick={handleExportUser}
          loading={isLoadingExport}
          className={styles.primaryButton}
          style={{ width: '100%' }}
        >
          {labelText.export}
        </Button>
      ),
    },
    {
      key: '4',
      label: (
        <Button
          type="primary"
          icon={<Icon.PlusOutlined />}
          onClick={() => {
            navigate(rc(RouteKey.UserCreate).path)
          }}
          style={{ width: '100%' }}
        >
          {labelText.addNewText}
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card
        title={`Danh sách ${headerLabel.user} (${dataTable?.length || 0})`}
        extra={
          <>
            {!(isMobile || isTablet) ? (
              <Space size={[APP_LAYOUT_GUTTER_SIZE_20, 0]}>
                <Tooltip title={labelText.uploadUserDataGuider}>
                  <Button
                    size="small"
                    shape="circle"
                    icon={<Icon.QuestionOutlined />}
                    onClick={handleOpenModalHelper}
                  />
                </Tooltip>
                <Upload showUploadList={false} customRequest={handleImportUser}>
                  <Button
                    type="primary"
                    icon={<Icon.UploadOutlined />}
                    loading={isLoadingImport}
                    className={styles.primaryButton}
                  >
                    {labelText.import}
                  </Button>
                </Upload>
                <Button
                  type="primary"
                  icon={<Icon.DownloadOutlined />}
                  onClick={handleExportUser}
                  loading={isLoadingExport}
                  className={styles.primaryButton}
                  style={{ width: '100%' }}
                >
                  {labelText.export}
                </Button>
                <Button
                  type="primary"
                  icon={<Icon.PlusOutlined />}
                  onClick={() => {
                    navigate(rc(RouteKey.UserCreate).path)
                  }}
                >
                  {labelText.addNewText}
                </Button>
              </Space>
            ) : (
              <Dropdown menu={{ items }} placement="bottomRight" arrow>
                <Button type="primary" icon={<Icon.MenuOutlined />}></Button>
              </Dropdown>
            )}
          </>
        }
        styles={{
          header: {
            padding: '12px 16px',
          },
          body: {
            padding: '14px 16px',
          },
        }}
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space direction="vertical" size="small" className={styles.totalBar} wrap>
            <div className={styles.toolbar}>
              <Space wrap>
                <Input
                  style={{ width: 300 }}
                  placeholder={labelText.search}
                  allowClear
                  onChange={(e) => handleInputChange(e.target.value)}
                  value={keyword}
                ></Input>
                {/* <Select
                loading={isLoading || isFetching}
                style={{ width: 200 }}
                placeholder={t('user-information-feature.position')}
                mode="multiple"
                allowClear
                onChange={(userType) => {
                  setUserType(userType)
                }}
                options={[
                  ...userTypes.map((userType) => {
                    return {
                      value: userType.id,
                      label: t(`user-information-feature.${userType.name}`),
                    }
                  }),
                ]}
              />
              <Select
                loading={isLoading || isFetching}
                style={{ width: 200 }}
                placeholder={t('table.status')}
                mode="multiple"
                allowClear
                onChange={(status) => {
                  setStatus(status)
                }}
                options={[
                  ...activeStatuses.map((status) => {
                    return {
                      value: status.id,
                      label: t(`general.${status.name}`),
                    }
                  }),
                ]}
              /> */}
              </Space>
            </div>
          </Space>
        </Space>
        {/* <Divider /> */}
        {selectedRowKeys.length > 0 && (
          <DeleteNav
            countItem={selectedRowKeys.length}
            handleDelete={handleDeleteSelectedUsers}
          />
        )}
        <Table
          rowKey="_id"
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          dataSource={data || dataTable}
          loading={isLoading || isFetching}
          pagination={
            result && result?.result?.pagination?.total > PAGE_TABLE.PERPAGE
              ? {
                  current: result?.result?.pagination.current_page,
                  pageSize: PAGE_TABLE.PERPAGE,
                  total: result?.result?.pagination?.total,
                  onChange(page) {
                    setCurrentPage(page)
                  },
                  showSizeChanger: false,
                }
              : false
          }
          className="custom-table"
          columns={[
            {
              title: '#',
              render: (text, user, index) => index + 1,
            },
            {
              title: labelText.userName,
              dataIndex: 'userName',
              render: (_, user) => (
                <Typography.Text ellipsis style={{ maxWidth: 180 }}>
                  {user?.userName || '-'}
                </Typography.Text>
              ),
            },
            {
              title: labelText.fullname,
              dataIndex: 'fullname',
              render: (_, user) => (
                <Space direction="vertical" size={[1, 1]}>
                  <Typography.Text ellipsis style={{ maxWidth: 300 }}>
                    {user?.fullname || '-'}
                  </Typography.Text>
                  <Typography.Text ellipsis style={{ maxWidth: 200 }}>
                    {user?.emailAddress || '-'}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: labelText.position,
              dataIndex: 'position',
              render: (_, user) => (
                <Typography.Paragraph
                  ellipsis={{
                    rows: 2,
                  }}
                  style={{
                    maxWidth: 180,
                    lineBreak: 'auto',
                  }}
                >
                  {user?.position || '-'}
                </Typography.Paragraph>
              ),
            },
            {
              title: labelText.status,
              dataIndex: 'status',
              sorter: false,
              render: (_, user) => {
                return (
                  <Space direction="vertical" style={{ maxWidth: 80 }}>
                    <Switch
                      loading={isLoadingUpdateUserStatus}
                      onChange={(e) => {
                        updateUserStatus({
                          status: e ? ActiveStatus.Active : ActiveStatus.Inactive,
                          id: user?.id,
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
                      checked={!!user.status}
                    />
                  </Space>
                )
              },
            },
            {
              align: 'right',
              render: (_, user) => {
                return (
                  <Space direction="horizontal">
                    {/* <Tooltip title={toastMessages.details}>
                      <Button
                        loading={false}
                        size="middle"
                        icon={<Icon.EyeOutlined />}
                        onClick={() => {
                          navigate(rc(RouteKey.UserUpdate).pather!(user.id))
                        }}
                      ></Button>
                    </Tooltip> */}
                    <Tooltip title={labelText.feedbackHis}>
                      <Button
                        loading={false}
                        size="middle"
                        icon={<Icon.UnorderedListOutlined />}
                        onClick={() => handleOpenModalFeedbackHis(user.forms[0]._id)}
                      ></Button>
                    </Tooltip>
                    <Tooltip title={labelText.emailSendingHis}>
                      <Button
                        loading={false}
                        size="middle"
                        icon={<Icon.HistoryOutlined />}
                        onClick={() => handleOpenModalSendMailHis(user.forms[0].logDatas || [])}
                      ></Button>
                    </Tooltip>
                    {user?.forms.length > 0 && (
                      <Tooltip title={labelText.sendEmail}>
                        <Button
                          loading={false}
                          size="middle"
                          icon={<Icon.SendOutlined />}
                          onClick={() => handleSendEmail(user)}
                        ></Button>
                      </Tooltip>
                    )}
                    <Tooltip title={labelText.exportPdfFile}>
                      <Button
                        loading={isExporting}
                        size="middle"
                        icon={<Icon.ExportOutlined />}
                        onClick={() => handleGetStatistic(user)}
                      ></Button>
                    </Tooltip>
                    {user?.forms.length === 0 && (
                      <Tooltip title={labelText.addFormForUser}>
                        <Button
                          loading={isLoadingAddForm}
                          size="middle"
                          icon={<Icon.PlusOutlined />}
                          onClick={() => {
                            handleAddFormForUser(user._id)
                          }}
                        ></Button>
                      </Tooltip>
                    )}
                    <Tooltip title={labelText.update}>
                      <Button
                        loading={false}
                        size="middle"
                        icon={<Icon.EditOutlined />}
                        onClick={() => {
                          navigate(rc(RouteKey.UserUpdate).pather!(user.id))
                        }}
                      ></Button>
                    </Tooltip>
                    <Tooltip title={labelText.delete}>
                      <Button
                        loading={isLoadingDeleteUser || isLoadingDeleteMultipleUsers}
                        size="middle"
                        danger={true}
                        icon={<Icon.DeleteOutlined />}
                        onClick={() => handleDeleteUser(user)}
                      ></Button>
                    </Tooltip>
                  </Space>
                )
              },
            },
          ]}
        />
        <SendEmailForm open={isOpenModal} formData={formData} onCancel={handleCloseModal} />
      </Card>

      {/* Modal hướng dẫn upload danh sách người dùng */}
      <ModalHelper
        title={`${labelText.uploadUserDataGuider} (tệp Excel)`}
        open={isOpenModalHelper}
        setIsOpenHelperModal={setIsOpenModalHelper}
        onDownloadTemplate={handleDownloadTemplate}
        width={900}
        dataSource={[
          {
            _id: '1',
            userName: 'user07',
            fullname: 'Phan Thanh Tuấn',
            emailAddress: 'user07@gmail.com',
            position: 'Nhân viên kỹ thuật',
          },
        ]}
        columns={[
          {
            title: labelText.fullname2,
            key: 'fullname',
            dataIndex: 'fullname',
          },
          {
            title: labelText.userName,
            key: 'userName',
            dataIndex: 'userName',
          },
          {
            title: labelText.email,
            key: 'emailAddress',
            dataIndex: 'emailAddress',
          },
          {
            title: labelText.position,
            key: 'position',
            dataIndex: 'position',
          },
        ]}
      />

      {/* Modal lịch sử gửi E-mail */}
      <ModalSendMailHis
        title={labelText.emailSendingHis}
        open={isOpenModalSendMailHis}
        handleClose={handleCloseModalSendMailHis}
        width={1200}
        dataSource={selectedDataLogs || []}
        columns={[
          {
            title: '#',
            render: (_: any, __: any, index: number) => index + 1,
            fixed: 'left',
          },
          {
            title: labelText.time,
            render: (_: any, item: any) => <Typography.Text>{item.time || '-'}</Typography.Text>,
            fixed: 'left',
          },
          {
            title: labelText.status,
            key: 'status',
            render: (_: any, item: any) => {
              const status = getMailSendingStatus(
                item.status,
                item.status == MailSendingStatus.Successfully && item.rejected.length > 0
              )

              return (
                <Tag color={status?.name}>
                  {status?.name ? (labelText as any)[status.name] : '-'}
                </Tag>
              )
            },
          },
          {
            title: labelText.sentEmail,
            render: (_: any, item: any) => {
              const isProcessing =
                item.status == MailSendingStatus.Successfully && item.rejected.length > 0

              return (
                <Typography.Paragraph style={{ maxWidth: 400 }}>
                  {item.status === MailSendingStatus.Failed
                    ? '-'
                    : item[isProcessing ? 'rejected' : 'accepted'].join(', ')}
                </Typography.Paragraph>
              )
            },
          },
          {
            title: labelText.errorLog,
            render: (_: any, item: any) => (
              <Typography.Paragraph style={{ maxWidth: 300 }}>
                {item.status === MailSendingStatus.Failed
                  ? item.code + ' - ' + item.response
                  : '-'}
              </Typography.Paragraph>
            ),
          },
        ]}
      />

      {/* Modal danh sách phản hồi */}
      <ModalFeedbackHis
        title={labelText.feedbackHis}
        open={isOpenModalFeedbackHis}
        handleClose={handleCloseModalFeedbackHis}
        width={800}
        form={selectedForm}
      />
    </>
  )
}
