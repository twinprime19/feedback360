/**
 * @file Login page

 */

import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, notification, Spin, Typography } from 'antd'
import * as Icon from '@ant-design/icons'

import styles from './style.module.less'
import classnames from 'classnames'
import { PAGE_INFO } from '@/constants/page'
import { useLazyValidateTokenQuery, useLoginMutation } from './apiSlice'
import { rc, RouteKey } from '@/routes'
import { checkExpiredToken, getToken } from '@/services/token'
import { APP_COLOR_PRIMARY, APP_LAYOUT_GUTTER_SIZE, BORDER_RADIUS } from '@/config'
import { labelText, toastMessages } from '@/constants/messages'
import { useAppDispatch } from '@/hooks'
import { logout } from './slice'
import { AppFooter } from '@/components/AppLayout/Footer'
import { ResponseError } from '../api'

export function Login() {
  // hooks
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  // query
  const [validateToken, { isLoading: isLoadingValidate, isSuccess: isSuccessValidateToken }] =
    useLazyValidateTokenQuery()
  const [loginAction, { isLoading: isLoadingLoginAction }] = useLoginMutation()

  useEffect(() => {
    if (getToken() && !checkExpiredToken()) {
      validateToken(undefined)
    } else {
      dispatch(logout())
    }
  }, [])

  const [form] = Form.useForm()
  const buttonSubmitHtml = useRef<any>(null)

  const handleSubmit = () => {
    form
      .validateFields()
      .then((value) => {
        loginAction(value)
          .unwrap()
          .then((response) => {
            if (response?.result?.user.isSuperAdmin) {
              navigate(rc(RouteKey.User).path)
            } else {
              navigate(rc(RouteKey.Questions).path)
            }
            notification.success({
              message: (
                <Typography.Text
                  style={{
                    fontSize: 14,
                  }}
                >
                  {toastMessages.loginSuccessfully}
                </Typography.Text>
              ),
            })
          })
          .catch((err: ResponseError) =>
            notification.error({
              message: (
                <Typography.Text
                  style={{
                    fontSize: 14,
                  }}
                >
                  {err?.data?.error || toastMessages.loginFailed}
                </Typography.Text>
              ),
            })
          )
      })
      .catch((err) => console.log(err))
  }

  // handle ENTER action
  const handleInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && buttonSubmitHtml.current) {
      buttonSubmitHtml.current.click()
    }
  }

  useEffect(() => {
    if (isSuccessValidateToken) {
      navigate(rc(RouteKey.User).path)
    }
  }, [isSuccessValidateToken])

  return (
    <div className={styles['layout']} style={{ position: 'fixed' }}>
      <div className={styles['login-container']}>
        <Spin
          spinning={isLoadingLoginAction || isLoadingValidate}
          indicator={<Icon.LoadingOutlined />}
        >
          <Form form={form}>
            <Form.Item>
              <Spin spinning={false} size="small">
                <div
                  className={styles['page-info']}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={PAGE_INFO.LOGO_HORIZONTAL2}
                    draggable={false}
                    className={classnames(styles.logo)}
                    width={300}
                  />
                </div>
              </Spin>
            </Form.Item>
            <Card bordered={false}>
              <Form.Item>
                <Spin spinning={false} size="small">
                  <Typography.Title
                    level={4}
                    style={{
                      color: '#000000',
                      marginBottom: 0,
                      width: 350,
                      textAlign: 'center',
                    }}
                  >
                    Đăng nhập
                  </Typography.Title>
                </Spin>
              </Form.Item>
              <Form.Item
                name="username"
                rules={[{ required: true, message: toastMessages.requiredMessage }]}
                style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE }}
              >
                <Input
                  prefix={
                    <Icon.UserOutlined
                      style={{
                        color: APP_COLOR_PRIMARY,
                      }}
                    />
                  }
                  onKeyDownCapture={handleInputKeyDown}
                  placeholder={labelText.userName}
                  size="large"
                ></Input>
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: toastMessages.requiredMessage }]}
                style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE }}
              >
                <Input.Password
                  size="large"
                  prefix={
                    <Icon.LockOutlined
                      style={{
                        color: APP_COLOR_PRIMARY,
                      }}
                    />
                  }
                  onKeyDownCapture={handleInputKeyDown}
                  placeholder="***********"
                  // style={{

                  // }}
                />
              </Form.Item>
              <Button
                ref={buttonSubmitHtml}
                block={true}
                size="large"
                loading={isLoadingLoginAction}
                onClick={handleSubmit}
                type="primary"
                style={{ backgroundColor: APP_COLOR_PRIMARY, borderRadius: BORDER_RADIUS }}
              >
                Đăng nhập
              </Button>
            </Card>
          </Form>
        </Spin>
      </div>
      <div
        style={{
          backgroundColor: APP_COLOR_PRIMARY,
          padding: `0 ${APP_LAYOUT_GUTTER_SIZE}px`,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <AppFooter />
      </div>
    </div>
  )
}
