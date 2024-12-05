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
  Cascader,
} from 'antd'
import * as Icon from '@ant-design/icons'

import { FormTypes } from '@/models/form'
import { Template } from '../model'
import { ResponseError } from '@/pages/api'
import {
  APP_LAYOUT_GUTTER_SIZE,
  APP_LAYOUT_GUTTER_SIZE_14,
  APP_LAYOUT_GUTTER_SIZE_16,
  pageStep,
  tokenSeparators,
} from '@/config'
import { ResultTypes } from '@/pages/Form/model'
import { ActiveStatus } from '@/models/status'
import { useAddTemplateMutation, useUpdateTemplateMutation } from '../apiSlice'
import { labelText, toastMessages } from '@/constants/messages'
import { useGetAllQuestionsQuery } from '@/pages/Questions/apiSlice'
import { debounce } from 'lodash'
import { PAGE_TABLE } from '@/constants/page'

interface Props {
  title: string
  open: boolean
  formData: Template | undefined
  onDone(): void
  onCancel(): void
  formType: FormTypes
}

const { Option, OptGroup } = Select

const defaultSubmit = {
  title: '',
  level: 1,
}

const options = [
  {
    label: 'Cấp 1 - Option 1',
    value: 'level1_option1',
    children: [
      {
        label: 'Cấp 2 - Option 1.1',
        value: 'level2_option1_1',
        children: [
          { label: 'Cấp 3 - Option 1.1.1', value: 'level3_option1_1_1' },
          { label: 'Cấp 3 - Option 1.1.2', value: 'level3_option1_1_2' },
        ],
      },
      { label: 'Cấp 2 - Option 1.2', value: 'level2_option1_2' },
    ],
  },
  {
    label: 'Cấp 1 - Option 2',
    value: 'level1_option2',
    children: [
      { label: 'Cấp 2 - Option 2.1', value: 'level2_option2_1' },
      { label: 'Cấp 2 - Option 2.2', value: 'level2_option2_2' },
    ],
  },
]

const handleChange = (value: string) => {
  console.log('Selected:', value)
}

export const TemplateForm: React.FC<Props> = (props) => {
  // hooks
  const [form] = Form.useForm<Template>()

  // states
  const [pageSize, setPageSize] = useState(pageStep)
  const [keyword, setKeyword] = useState<string>('')
  const [levels, setLevels] = useState<number>(1)

  // query apis
  const {
    data: result,
    isLoading,
    isFetching,
  } = useGetAllQuestionsQuery({
    keyword: keyword || null,
    page_size: pageSize,
    page: 1,
    // levels
  })
  const [addTemplate, { isLoading: isLoadingAdd }] = useAddTemplateMutation()
  const [updateTemplate, { isLoading: isLoadingUpdate }] = useUpdateTemplateMutation()

  const handleSubmit = () => {
    form
      .validateFields()
      .then((value) => {
        console.log('value: ', value)
        // if (props.formType === FormTypes.UPDATE) {
        //   updateTemplate({
        //     ...defaultSubmit,
        //     ...value,
        //     _id: props.formData?._id!,
        //   })
        //     .unwrap()
        //     .then(() => {
        //       notification.success({
        //         message: (
        //           <Typography.Text
        //             style={{
        //               fontSize: 14,
        //             }}
        //           >
        //             {toastMessages.updateSuccessfully}
        //           </Typography.Text>
        //         ),
        //       })
        //       props.onDone()
        //     })
        //     .catch((err: ResponseError) => {
        //       notification.error({
        //         message: (
        //           <Typography.Text
        //             style={{
        //               fontSize: 14,
        //             }}
        //           >
        //             {err?.data?.message ?? err.statusText ?? toastMessages.updateFailed}
        //           </Typography.Text>
        //         ),
        //       })
        //     })
        // } else {
        //   addTemplate({
        //     ...defaultSubmit,
        //     ...value,
        //   })
        //     .unwrap()
        //     .then(() => {
        //       notification.success({
        //         message: (
        //           <Typography.Text
        //             style={{
        //               fontSize: 14,
        //             }}
        //           >
        //             {toastMessages.addSuccessfully}
        //           </Typography.Text>
        //         ),
        //       })
        //       props.onDone()
        //     })
        //     .catch((err: ResponseError) => {
        //       console.log(err)
        //       notification.error({
        //         message: (
        //           <Typography.Text
        //             style={{
        //               fontSize: 14,
        //             }}
        //           >
        //             {err?.data?.message ?? err.statusText ?? toastMessages.addFailed}
        //           </Typography.Text>
        //         ),
        //       })
        //     })
        // }
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

  const handleRefresh = () => {
    form.resetFields()
    setKeyword('')
    setLevels(1)
    setPageSize(pageStep)
  }

  useEffect(() => {
    if (!props.open) {
      handleRefresh()
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
      {/* <Cascader
        options={options}
        onChange={handleChange}
        placeholder="Select an option"
        style={{ width: 300 }}
        changeOnSelect
      /> */}
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
          name="level"
          label={labelText.maxDepthLevels}
          rules={[
            {
              required: true,
              message: toastMessages.requiredMessage,
            },
          ]}
        >
          <InputNumber min={1} style={{ width: '100%' }} onChange={(e) => setLevels(e || 1)} />
        </Form.Item>
        <Form.Item
          style={{ marginBottom: APP_LAYOUT_GUTTER_SIZE_16 }}
          label={labelText.question}
          name="questions"
        >
          <Select
            mode="multiple"
            allowClear
            showSearch
            placeholder={labelText.chooseQuestions}
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
        </Form.Item>
      </Form>
    </Modal>
  )
}
