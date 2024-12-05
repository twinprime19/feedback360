import React, { useEffect, useState } from 'react'
import { Input, Button, notification, Row, Col, Card, Spin, Typography, Form, Radio } from 'antd'

import styles from './style.module.less'
import { ResponseError } from '@/pages/api'
import {
  APP_LAYOUT_GUTTER_SIZE,
  APP_LAYOUT_GUTTER_SIZE_16,
  APP_LAYOUT_GUTTER_SIZE_20,
  BASE_PATH,
} from '@/config'

import { headerLabel, labelText, toastMessages } from '@/constants/messages'
import { ThumbnailResponse } from '@/models/file'
import BaseImageUploader from '@/components/common/BaseImageUploader'
import { useDeviceType } from '@/hooks/useDeviceType'
import { GenderState, genderStates } from '@/models/gender'
import { useUpdateProfileMutation } from './apiSlice'
import { Profile } from './model'
import { useAppSelector } from '@/hooks'

const defaultSubmit: Profile = {
  userName: '',
  fullname: '',
  emailAddress: '',
  phone: '',
  avatar: null,
  gender: GenderState.MALE,
}

export const InformationPage = () => {
  // hooks
  const [form] = Form.useForm<Profile>()
  const { isMobile, isTablet, isLargeTablet, isSmallDesktop, isDesktop, isLargeDesktop } =
    useDeviceType()
  const { loggedUser } = useAppSelector((state) => state.auth)

  // states
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [gender, setGender] = useState<GenderState>(GenderState.MALE)

  // api
  const [updateProfile, { isLoading: isLoadingUpdate }] = useUpdateProfileMutation()

  const handleSubmit = () => {
    form.validateFields().then((formValue: Profile) => {
      const submitValues: Profile = {
        ...defaultSubmit,
        ...formValue,
        avatar: avatarId,
        gender,
      }

      updateProfile(submitValues)
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
    })
  }

  const handleRestoreDefault = () => {
    form.resetFields()
    setAvatarId('')
    setAvatarUrl(undefined)
    setGender(GenderState.MALE)
  }

  useEffect(() => {
    if (loggedUser) {
      const avatar = loggedUser.avatar?.thumbnail?.path
        ? BASE_PATH + loggedUser.avatar?.thumbnail?.path
        : null

      form.setFieldsValue({
        ...loggedUser,
        avatar,
      })

      setAvatarUrl(avatar ?? undefined)
      setAvatarId(loggedUser.avatar?._id || null)
      setGender(loggedUser?.gender || GenderState.MALE)
    }
  }, [loggedUser])

  return (
    <Spin spinning={false}>
      <Card
        title={headerLabel.information}
        styles={{
          header: {
            padding: APP_LAYOUT_GUTTER_SIZE_16,
          },
          body: {
            margin: 'auto',
            width: isLargeDesktop
              ? '50%'
              : isDesktop
              ? '70%'
              : isSmallDesktop
              ? '90%'
              : isLargeTablet
              ? '90%'
              : '100%',
          },
        }}
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
              <Row gutter={[APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE_16]}>
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
                  {(isMobile || isTablet || isLargeTablet) && (
                    <>
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
                        name="emailAddress"
                        label={labelText.email}
                        rules={[
                          { required: true, message: toastMessages.requiredMessage },
                          {
                            type: 'email',
                            message: toastMessages.invalidEmailMessage,
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          className={styles.inputForm}
                          placeholder={labelText.email}
                          type="email"
                        />
                      </Form.Item>
                    </>
                  )}
                  {!(isMobile || isTablet || isLargeTablet) && (
                    <>
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
                        label={labelText.gender}
                      >
                        <Radio.Group value={gender} onChange={(e) => setGender(e.target.value)}>
                          {genderStates.map((gender) => (
                            <Radio value={gender.id} key={gender.id}>
                              {gender.name}
                            </Radio>
                          ))}
                        </Radio.Group>
                      </Form.Item>
                    </>
                  )}
                </Col>
                <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
                  {!(isMobile || isTablet || isLargeTablet) && (
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
                  )}
                  <Form.Item
                    className={styles.formItem}
                    colon={false}
                    name="phone"
                    label={labelText.phoneNumber}
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: toastMessages.invalidPhoneNumberMessage,
                      },
                    ]}
                    style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                  >
                    <Input className={styles.inputForm} placeholder={labelText.phoneNumber} />
                  </Form.Item>
                  {(isMobile || isTablet || isLargeTablet) && (
                    <Form.Item
                      style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
                      colon={false}
                      label={labelText.gender}
                    >
                      <Radio.Group value={gender} onChange={(e) => setGender(e.target.value)}>
                        {genderStates.map((gender) => (
                          <Radio value={gender.id} key={gender.id}>
                            {gender.name}
                          </Radio>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                  )}
                </Col>
              </Row>

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
                    loading={isLoadingUpdate}
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
                    loading={isLoadingUpdate}
                  >
                    {labelText.restoreDefault}
                  </Button>
                </Col>
              </Row>
            </div>

            <Form.Item
              className={styles.formItem}
              colon={false}
              name="avatar"
              label={labelText.avatar}
              style={{
                marginBottom: 0,
                width: isMobile ? '100%' : 200,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  aspectRatio: '1/1',
                  marginBottom: APP_LAYOUT_GUTTER_SIZE_16,
                  maxWidth: 300,
                }}
              >
                <BaseImageUploader
                  imgUrl={avatarUrl}
                  action={(data: ThumbnailResponse & { _id: string }) => {
                    setAvatarUrl(BASE_PATH + data.thumbnail.path)
                    setAvatarId(data._id)
                  }}
                />
              </div>
              <span style={{ fontSize: 12 }}>{toastMessages.avatarRecommendMessage}</span>
            </Form.Item>
          </div>
        </Form>
      </Card>
    </Spin>
  )
}
