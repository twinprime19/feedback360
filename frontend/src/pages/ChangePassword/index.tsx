/**
 * @file Tag list page

 */

import React from 'react'
import { Button, Card, Input, notification, Row, Col, Form, Spin, Typography } from 'antd'
import { omit } from 'lodash'
import { NamePath } from 'antd/es/form/interface'
import { RuleObject } from 'antd/es/form'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { ResponseError } from '../api'
import { logout } from '../Login/slice'
import { ChangePassword } from './model'
import { removeToken } from '@/services/token'
import { RouteKey, rc } from '@/routes'
import { useChangePasswordPatientMutation } from './apiSlice'
import { headerLabel, labelText, toastMessages } from '@/constants/messages'
import { APP_COLOR_PRIMARY, BORDER_RADIUS } from '@/config'

export const ChangePasswordPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form] = Form.useForm<ChangePassword>()

  const [changePassword, { isLoading: isLoadingChangePassword }] =
    useChangePasswordPatientMutation()

  const handleChangePassword = () => {
    form.validateFields().then((formValue) => {
      const submitValues = omit(formValue, ['confirmPassword'])

      changePassword(submitValues)
        .unwrap()
        .then(() => {
          notification.success({
            message: (
              <Typography.Text
                style={{
                  fontSize: 14,
                }}
              >
                {toastMessages.changePasswordSuccessfully}
              </Typography.Text>
            ),
          })
          removeToken()
          dispatch(logout())
          navigate(rc(RouteKey.Login).path)
        })
        .catch((err: ResponseError) => {
          notification.error({
            message: (
              <Typography.Text
                style={{
                  fontSize: 14,
                }}
              >
                {err?.data?.error || toastMessages.changePasswordFailed}
              </Typography.Text>
            ),
          })
        })
    })
  }

  //validator
  const newPasswordValidator = ({
    getFieldValue,
  }: {
    getFieldValue: (name: NamePath) => any
  }) => ({
    validator(_: RuleObject, value: string) {
      if (getFieldValue('password') !== value) {
        return Promise.resolve()
      }
      return Promise.reject(new Error(toastMessages.newPasswordValidate))
    },
  })

  const confirmPasswordValidator = ({
    getFieldValue,
  }: {
    getFieldValue: (name: NamePath) => any
  }) => ({
    validator(_: RuleObject, value: string) {
      if (getFieldValue('newPassword') === value || (!getFieldValue('newPassword') && !value)) {
        return Promise.resolve()
      }
      return Promise.reject(new Error(toastMessages.confirmPasswordValidate))
    },
  })

  return (
    <Spin spinning={isLoadingChangePassword}>
      <Card
        title={headerLabel.changePassword}
        styles={{
          header: {
            padding: 16,
          },
          body: {
            width: '100%',
            margin: 'auto',
          },
        }}
      >
        <Row>
          <Col
            xs={{ span: 24, offset: 0 }}
            sm={{ span: 14, offset: 5 }}
            md={{ span: 12, offset: 6 }}
            lg={{ span: 10, offset: 7 }}
            xl={{ span: 8, offset: 8 }}
            xxl={{ span: 6, offset: 9 }}
          >
            <Form form={form} layout="vertical">
              <Form.Item
                colon={false}
                name="password"
                label={labelText.currentPassword}
                rules={[
                  {
                    required: true,
                    message: toastMessages.requiredMessage,
                  },
                  {
                    min: 6,
                    message: toastMessages.minLengthPasswordMessage,
                  },
                  {
                    max: 256,
                    message: toastMessages.maxLengthPasswordMessage,
                  },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input.Password placeholder="********" />
              </Form.Item>
              <Form.Item
                colon={false}
                name="newPassword"
                label={labelText.newPassword}
                dependencies={['password']}
                rules={[
                  {
                    required: true,
                    message: toastMessages.requiredMessage,
                  },
                  {
                    min: 6,
                    message: toastMessages.minLengthPasswordMessage,
                  },
                  {
                    max: 256,
                    message: toastMessages.maxLengthPasswordMessage,
                  },
                  newPasswordValidator,
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input.Password placeholder="********" />
              </Form.Item>
              <Form.Item
                colon={false}
                name="confirmPassword"
                dependencies={['newPassword']}
                label={labelText.confirmPassword}
                rules={[
                  {
                    required: true,
                    message: toastMessages.requiredMessage,
                  },
                  confirmPasswordValidator,
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input.Password placeholder="********" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                onClick={handleChangePassword}
                style={{
                  width: '100%',
                  height: '2.5rem',
                  backgroundColor: APP_COLOR_PRIMARY,
                  borderRadius: BORDER_RADIUS,
                }}
                loading={isLoadingChangePassword}
              >
                {labelText.save}
              </Button>
            </Form>
          </Col>
        </Row>
      </Card>
    </Spin>
  )
}
