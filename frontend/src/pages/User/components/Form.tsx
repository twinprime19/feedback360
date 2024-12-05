import React, { useEffect, useState } from 'react'
import {
  Input,
  Button,
  notification,
  Row,
  Col,
  Card,
  Spin,
  Typography,
  Switch,
  Table,
  Form,
  Radio,
} from 'antd'
import { NamePath } from 'antd/es/form/interface'
import { RuleObject } from 'antd/es/form'
import { useNavigate, useParams } from 'react-router-dom'

import { User, UserCreate, UserUpdate } from '../model'
import { FormTypes } from '@/models/form'
import styles from '../style.module.less'
import { ResponseError } from '@/pages/api'
import { RouteKey, rc } from '@/routes'
import { ActiveStatus } from '@/models/status'
import {
  APP_LAYOUT_GUTTER_SIZE,
  APP_LAYOUT_GUTTER_SIZE_16,
  APP_LAYOUT_GUTTER_SIZE_20,
  BASE_PATH,
} from '@/config'

import { labelText, toastMessages } from '@/constants/messages'
import { useAddUserMutation, useGetUserByIdQuery, useUpdateUserMutation } from '../apiSlice'
import { useDeviceType } from '@/hooks/useDeviceType'

interface Props {
  formData?: User | undefined
  formType: FormTypes
}

const defaultSubmit: UserCreate = {
  userName: '',
  fullname: '',
  emailAddress: '',
  position: '',
  status: ActiveStatus.Active,
}

type StaffParamsType = {
  _id?: string
}

export const UserForm: React.FC<Props> = (props) => {
  // hooks
  const params = useParams<StaffParamsType>()
  const [form] = Form.useForm<UserCreate>()
  const navigate = useNavigate()
  const { isMobile, isTablet, isLargeTablet, isSmallDesktop, isDesktop, isLargeDesktop } =
    useDeviceType()

  // api
  const {
    data: userData,
    isLoading: isLoadingUserData,
    isError: isErrorUserData,
    error: errorUserData,
  } = useGetUserByIdQuery(params._id, { skip: params._id ? false : true })

  const [createUser, { isLoading: isLoadingCreate }] = useAddUserMutation()
  const [updateUser, { isLoading: isLoadingUpdate }] = useUpdateUserMutation()

  const handleSubmit = () => {
    form.validateFields().then((formValue: UserCreate | UserUpdate) => {
      const submitValues: UserCreate | UserUpdate = {
        ...defaultSubmit,
        ...formValue,
      }

      // Create
      if (props.formType === FormTypes.CREATE) {
        const createSubmitValues: UserCreate = submitValues as UserCreate
        createUser(createSubmitValues)
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
            navigate(rc(RouteKey.User).path)
          })
          .catch((err: ResponseError) => {
            notification.error({
              message: (
                <Typography.Text
                  style={{
                    fontSize: 14,
                  }}
                >
                  {err?.data?.error ?? err.statusText ?? toastMessages.addFailed}
                </Typography.Text>
              ),
            })
          })
      }
      // Update
      else {
        const updateSubmitValues: UserUpdate = { ...submitValues, id: params._id } as UserUpdate

        updateUser(updateSubmitValues)
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
            navigate(rc(RouteKey.User).path)
          })
          .catch((err: ResponseError) => {
            notification.error({
              message: (
                <Typography.Text
                  style={{
                    fontSize: 14,
                  }}
                >
                  {err?.data?.message ?? err.statusText ?? toastMessages.updateFailed}
                </Typography.Text>
              ),
            })
          })
      }
    })
  }

  const handleRestoreDefault = () => {
    form.resetFields()
  }

  useEffect(() => {
    if (userData) {
      form.setFieldsValue(userData)
    }
  }, [userData])

  //handle get error
  useEffect(() => {
    if (isErrorUserData) {
      notification.error({
        message: (
          <Typography.Text
            style={{
              fontSize: 14,
            }}
          >
            {(errorUserData as ResponseError)?.statusText}
          </Typography.Text>
        ),
      })
    }
  }, [isErrorUserData])

  return (
    <Spin spinning={false}>
      <Card
        title={props.formType === FormTypes.CREATE ? 'Thêm người dùng' : 'Cập nhật người dùng'}
        styles={{
          header: {
            padding: APP_LAYOUT_GUTTER_SIZE_16,
          },
          body: {
            margin: 'auto',
            width:
              isDesktop || isLargeDesktop
                ? '60%'
                : isSmallDesktop
                ? '80%'
                : isLargeTablet
                ? '90%'
                : isTablet
                ? '80%'
                : '100%',
          },
        }}
        loading={isLoadingUserData}
      >
        <Form form={form} layout="vertical" initialValues={defaultSubmit}>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column-reverse' : 'row',
              gap: APP_LAYOUT_GUTTER_SIZE,
            }}
          >
            <div style={{ flex: 1 }}>
              {isLargeDesktop || isDesktop || isSmallDesktop || isLargeTablet ? (
                <Row gutter={[APP_LAYOUT_GUTTER_SIZE, 0]}>
                  <Col span={12}>
                    <Form.Item
                      className={styles.formItem}
                      colon={false}
                      name="userName"
                      label={labelText.userName}
                      rules={[{ required: true, message: toastMessages.requiredMessage }]}
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                    >
                      <Input className={styles.inputForm} placeholder={labelText.userName} />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      colon={false}
                      name="emailAddress"
                      label={labelText.email}
                      rules={[
                        { required: true, message: toastMessages.requiredMessage },
                        {
                          type: 'email',
                          message: toastMessages.invalidEmailMessage,
                        },
                      ]}
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                    >
                      <Input
                        className={styles.inputForm}
                        placeholder={labelText.email}
                        type="email"
                      />
                    </Form.Item>
                    <Form.Item
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                      colon={false}
                      name="status"
                      label={labelText.status}
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      className={styles.formItem}
                      colon={false}
                      name="fullname"
                      label={labelText.fullname}
                      rules={[{ required: true, message: toastMessages.requiredMessage }]}
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                    >
                      <Input className={styles.inputForm} placeholder={labelText.fullname} />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      colon={false}
                      name="position"
                      label={labelText.position}
                      rules={[{ required: true, message: toastMessages.requiredMessage }]}
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                    >
                      <Input className={styles.inputForm} placeholder={labelText.position} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : (
                <Row gutter={[APP_LAYOUT_GUTTER_SIZE, 0]}>
                  <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
                    <Form.Item
                      className={styles.formItem}
                      colon={false}
                      name="userName"
                      label={labelText.userName}
                      rules={[{ required: true, message: toastMessages.requiredMessage }]}
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                    >
                      <Input className={styles.inputForm} placeholder={labelText.userName} />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      colon={false}
                      name="emailAddress"
                      label={labelText.email}
                      rules={[
                        { required: true, message: toastMessages.requiredMessage },
                        {
                          type: 'email',
                          message: toastMessages.invalidEmailMessage,
                        },
                      ]}
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                    >
                      <Input
                        className={styles.inputForm}
                        placeholder={labelText.email}
                        type="email"
                      />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      colon={false}
                      name="position"
                      label={labelText.position}
                      rules={[{ required: true, message: toastMessages.requiredMessage }]}
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                    >
                      <Input className={styles.inputForm} placeholder={labelText.position} />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      colon={false}
                      name="fullname"
                      label={labelText.fullname}
                      rules={[{ required: true, message: toastMessages.requiredMessage }]}
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                    >
                      <Input className={styles.inputForm} placeholder={labelText.fullname} />
                    </Form.Item>
                    <Form.Item
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                      colon={false}
                      name="status"
                      label={labelText.status}
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              <Row
                gutter={[APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE]}
                style={{
                  flexDirection: isMobile ? 'column' : 'row-reverse',
                  marginTop: APP_LAYOUT_GUTTER_SIZE_20 / 2,
                }}
              >
                <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    onClick={handleSubmit}
                    style={{
                      width: '100%',
                      height: '2.5rem',
                    }}
                    loading={isLoadingCreate || isLoadingUpdate}
                  >
                    {labelText.save}
                  </Button>
                </Col>
                <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                  <Button
                    ghost
                    type="primary"
                    onClick={handleRestoreDefault}
                    style={{
                      width: '100%',
                      height: '2.5rem',
                    }}
                    loading={isLoadingCreate || isLoadingUpdate}
                  >
                    {labelText.restoreDefault}
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </Form>
      </Card>
    </Spin>
  )
}
