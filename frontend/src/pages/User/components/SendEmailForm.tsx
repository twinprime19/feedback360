import React, { useEffect, useState } from 'react'
import { Form, Button, Modal, Radio, Row, Col, Input, notification, Typography } from 'antd'

import { User, UserCreate } from '../model'
import { APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE_16, DOMAIN } from '@/config'
import { ResponseError } from '@/pages/api'
import { labelText, toastMessages } from '@/constants/messages'
import { Editor } from '@/components/common/Editor'
import { defaultTemplate } from '@/constants/emailTemplate'
import { relations } from '@/constants/relation'
import { useSendEmailMutation } from '@/pages/Form/apiSlice'
import { SendEmailType } from '@/pages/Form/model'

interface Props {
  formData: User | undefined
  open: boolean
  onCancel(): void
}

const defaultSubmit: any = {
  relationship: relations[0].value,
}

export const SendEmailForm: React.FC<Props> = (props) => {
  // hooks
  const { formData, onCancel, open } = props

  const [form] = Form.useForm<UserCreate>()
  const defaultContent = defaultTemplate
    .replace(/\[USER_FULLNAME\]/g, (formData?.fullname || '[USER_FULLNAME]').trim())
    .replace(/\[LINK\]/g, (DOMAIN + `form/:formId`).trim())

  // states
  const [selectedRelation, setSelectedRelation] = useState(relations[0].value)
  // const [editorData, setEditorData] = useState(defaultContent)

  // api
  const [sendEmail, { isLoading: isLoadingSend }] = useSendEmailMutation()

  const handleSubmit = () => {
    form.validateFields().then((formValue: any) => {
      const submitValues: SendEmailType = {
        ...defaultSubmit,
        ...formValue,
        listEmailAddress: formValue.listEmailAddress?.replace(/\s+/g, ''),
        form: formData?.forms?.[0]._id,
      }

      // console.log('submitValues: ', submitValues)
      // return

      sendEmail(submitValues)
        .unwrap()
        .then(() => {
          notification.success({
            message: (
              <Typography.Text
                style={{
                  fontSize: 14,
                }}
              >
                {toastMessages.sendEmailSuccessfully}
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
                {err?.data?.error ?? err.statusText ?? toastMessages.sendEmailFailed}
              </Typography.Text>
            ),
          })
        })
    })
  }

  useEffect(() => {
    if (!open) {
      form.resetFields()
    } else {
      if (formData) {
        form.setFieldsValue(formData)
      } else {
        form.resetFields()
      }
    }
  }, [open])

  return (
    <Modal
      title={labelText.sendEmail}
      confirmLoading={false}
      okButtonProps={{
        disabled: false,
      }}
      cancelButtonProps={{
        hidden: true,
      }}
      forceRender
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      centered={true}
      width={600}
      footer={[
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          style={{ width: '100%', marginTop: '0px' }}
          loading={isLoadingSend}
        >
          {labelText.send}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={defaultSubmit}>
        <Form.Item
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
          colon={false}
          name="listEmailAddress"
          label={labelText.receiverMultiable}
          rules={[
            {
              required: true,
              message: toastMessages.requiredMessage,
            },
            // {
            //   type: 'email',
            //   message: toastMessages.invalidEmailMessage,
            // },
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.resolve()
                }

                // Tách các email dựa trên dấu `;`
                const emailList = value.split(';').map((email: string) => email.trim())

                // Kiểm tra từng email có hợp lệ không
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                const isValid = emailList.every((email: string) => emailRegex.test(email))

                if (isValid) {
                  return Promise.resolve()
                } else {
                  return Promise.reject(new Error(toastMessages.invalidEmailMessage))
                }
              },
            },
          ]}
        >
          <Input placeholder={labelText.receiver} type="email" />
        </Form.Item>
        <Form.Item
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
          colon={false}
          name="relationship"
          label={labelText.relationship}
        >
          <Radio.Group
            style={{
              width: '100%',
            }}
            onChange={(e) => setSelectedRelation(e.target.value)}
            value={selectedRelation}
          >
            <Row gutter={[APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE / 3]}>
              {relations.map((item) => (
                <Col xs={12} sm={12} md={12} lg={6} xl={6} key={item.value}>
                  <Radio value={item.value} className="customRadioButton">
                    {item.name}
                  </Radio>
                </Col>
              ))}
            </Row>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
          colon={false}
          label={labelText.emailTemplate}
          rules={[
            {
              required: true,
              message: toastMessages.requiredMessage,
            },
          ]}
        >
          <Editor defaultData={defaultContent} disabled={true} hideToolbar={true} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
