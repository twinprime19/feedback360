/* eslint-disable */
import React, { useCallback, useEffect, useState } from 'react'
import {
  Form,
  Input,
  Modal,
  Button,
  notification,
  Row,
  Col,
  Switch,
  InputNumber,
  Space,
  Tooltip,
  Typography,
  Radio,
  Select,
  Spin,
} from 'antd'
import * as Icon from '@ant-design/icons'

import { FormTypes } from '@/models/form'
import { Question } from '../model'
import { ResponseError } from '@/pages/api'
import {
  APP_LAYOUT_GUTTER_SIZE,
  APP_LAYOUT_GUTTER_SIZE_14,
  APP_LAYOUT_GUTTER_SIZE_16,
  pageStep,
} from '@/config'
import { ResultTypes } from '@/pages/Form/model'
import { ActiveStatus } from '@/models/status'
import {
  useAddQuestionMutation,
  useGetAllQuestionsQuery,
  useUpdateQuestionMutation,
} from '../apiSlice'
import { labelText, toastMessages } from '@/constants/messages'
import { useDeviceType } from '@/hooks/useDeviceType'
import { debounce } from 'lodash'
import { PAGE_TABLE } from '@/constants/page'

interface Props {
  title: string
  open: boolean
  formData: Question | undefined
  onDone(): void
  onCancel(): void
  formType: FormTypes
}

const { Group } = Radio

const defaultSubmit = {
  title: '',
  content: '',
  type: ResultTypes.POINT,
  status: ActiveStatus.Active,
  extends: [],
  // level: 1,
}

export const QuestionForm: React.FC<Props> = (props) => {
  const [form] = Form.useForm<Question>()
  const { isMobile, isTablet } = useDeviceType()

  // states
  const [pageSize, setPageSize] = useState(pageStep)
  const [keyword, setKeyword] = useState<string>('')

  //api
  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllQuestionsQuery({
    keyword: keyword || null,
    page_size: pageSize,
    page: 1,
  })
  const [addQuestion, { isLoading: isLoadingAdd }] = useAddQuestionMutation()
  const [updateQuestion, { isLoading: isLoadingUpdate }] = useUpdateQuestionMutation()

  const handleSubmit = () => {
    form
      .validateFields()
      .then((value) => {
        if (props.formType === FormTypes.UPDATE) {
          updateQuestion({
            ...defaultSubmit,
            ...value,
            _id: props.formData?._id!,
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
              props.onDone()
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
        } else {
          addQuestion({
            ...defaultSubmit,
            ...value,
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
              props.onDone()
            })
            .catch((err: ResponseError) => {
              console.log(err)
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
      })
      .catch(
        (err) =>
          new Promise((resolve) => {
            setTimeout(() => resolve(err), 200)
            console.log(err)
          })
      )
      .then((err) => {
        const errElm = document.querySelector('.ant-form-item-has-error')
        if (errElm) {
          errElm.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      })
      .catch((err) => console.log(err))
  }

  const handleScrollQuestion = (event: any) => {
    const { target } = event
    if (
      target.scrollTop + target.offsetHeight === target.scrollHeight &&
      result?.result.data &&
      result?.result.pagination.total > result?.result.data.length &&
      !isLoading
    ) {
      setPageSize((prevPage) => prevPage + pageStep)
    }
  }

  // search Question
  const debouncedChangeQuestionHandler = useCallback(
    debounce((newKeyword: string) => {
      setKeyword(newKeyword)
    }, PAGE_TABLE.DEBOUNCE_DELAY),
    []
  )

  const handleInputQuestionChange = (newKeyword: string) => {
    debouncedChangeQuestionHandler(newKeyword)
  }

  const handleClearQuestion = () => {
    setKeyword('')
  }

  useEffect(() => {
    if (!props.open) {
      form.resetFields()
    } else {
      if (props.formData) {
        form.setFieldsValue(props.formData)
      } else {
        form.resetFields()
      }
    }
  }, [props.open])

  return (
    <Modal
      title={props.title}
      confirmLoading={false}
      okButtonProps={{
        disabled: false,
      }}
      cancelButtonProps={{
        hidden: true,
      }}
      forceRender
      open={props.open}
      onCancel={props.onCancel}
      onOk={handleSubmit}
      centered={true}
      width={600}
      footer={[
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          style={{ width: '100%', marginTop: '0px' }}
          loading={isLoadingAdd || isLoadingUpdate}
        >
          {labelText.save}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...defaultSubmit,
          ...props?.formData,
        }}
      >
        <Form.Item
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
          colon={false}
          name="title"
          label={labelText.title}
          rules={[
            {
              required: true,
              message: toastMessages.requiredMessage,
            },
          ]}
        >
          <Input placeholder={labelText.title} />
        </Form.Item>
        <Form.Item
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
          colon={false}
          name="content"
          label={labelText.content}
        >
          <Input.TextArea rows={5} placeholder={labelText.content} />
        </Form.Item>
        <Row
          gutter={[APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE / 3]}
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
        >
          <Col span={isMobile ? 24 : 12}>
            <Form.Item
              colon={false}
              name="type"
              label={labelText.type}
              style={{ marginBottom: 0 }}
            >
              <Group
                onChange={(e) => console.log(e.target.value)}
                style={{ paddingLeft: APP_LAYOUT_GUTTER_SIZE_14 }}
              >
                <Row gutter={[APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE / 3]}>
                  <Radio value={ResultTypes.POINT}>Thang điểm</Radio>
                  <Radio value={ResultTypes.TEXT}>Tự do</Radio>
                </Row>
              </Group>
            </Form.Item>
          </Col>
          <Col span={isMobile ? 24 : 12}>
            <Form.Item
              style={{ marginBottom: 0 }}
              colon={false}
              name="status"
              label={labelText.status}
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        {/* <Form.Item
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
          colon={false}
          name="level"
          label={labelText.level}
          rules={[
            {
              required: true,
              message: toastMessages.requiredMessage,
            },
          ]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
          label={labelText.parentQuestion}
          name="questions"
        >
          <Select
            mode="multiple"
            allowClear
            showSearch
            placeholder={labelText.chooseParentQuestion}
            filterOption={false}
            options={(result?.result?.data || []).map((user) => {
              return {
                value: user?._id,
                label: user?.title,
              }
            })}
            onPopupScroll={handleScrollQuestion}
            notFoundContent={
              isLoading || isFetching ? (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Spin size="small" />
                </div>
              ) : null
            }
            onSearch={handleInputQuestionChange}
            onClear={() => handleClearQuestion()}
            disabled={!result || result?.result?.pagination?.total === 0 || !result?.result?.data}
            loading={isLoading || isFetching}
          />
        </Form.Item> */}
      </Form>
    </Modal>
  )
}
