import TextArea from 'antd/es/input/TextArea'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  notification,
  Radio,
  Row,
  Space,
  Spin,
  Typography,
} from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as Icon from '@ant-design/icons'

import { FontType, getFSFromType } from '@/constants/fontSize'
import { PAGE_INFO } from '@/constants/page'
import { rc, RouteKey } from '@/routes'
import styles from './style.module.less'
import './style.less'
import {
  APP_COLOR_PRIMARY,
  APP_COLOR_SECONDARY,
  APP_LAYOUT_GUTTER_SIZE,
  APP_LAYOUT_GUTTER_SIZE_2,
  APP_LAYOUT_GUTTER_SIZE_20,
  APP_LAYOUT_GUTTER_SIZE_4,
  APP_LAYOUT_GUTTER_SIZE_6,
  APP_LAYOUT_GUTTER_SIZE_8,
  BORDER_RADIUS,
} from '@/config'
import { relations } from '@/constants/relation'
import {
  defaultAnswer,
  defaultPoint,
  FormState,
  getAnswerValueByQuestion,
  getFirstEmptyAnswerQuestion,
  getFirstEmptyReviewQuestion,
  getReviewValueByQuestion,
  setFieldValue,
  setState,
} from './slice'
import { useAppSelector } from '@/hooks'
import LevelsTable from './components/LevelsTable'
import {
  useAddFeedbackMutation,
  useGetFormByIdQuery,
  useGetFormRelationshipQuery,
} from './apiSlice'
import { ResponseError } from '../api'
import { getQuestions, removeQuestions, setQuestions } from '@/services/question'
import { Children, QuestionChildren, QuestionNewType, QuestionTypes, ResultTypes } from './model'
import { Question } from '../Questions/model'
import { labelText, toastMessages } from '@/constants/messages'
import { ResponseStatus } from '@/services/axiosHelper'
import { AppFooter } from '@/components/AppLayout/Footer'
import { checkExpiredToken } from '@/services/token'
import { logout } from '../Login/slice'
import ErrorMessage from '@/components/common/ErrorMessage'
import { maxLengthLevels } from '@/constants/level'

const { Title, Text } = Typography

const FormPage = () => {
  // hooks
  const { formId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const formStates = useAppSelector((state) => state.form)

  const questions = getQuestions()
  const isSkip = questions && !isEmpty(questions)

  // queries
  const {
    data: questionsResult,
    isLoading: isLoadingQuestions,
    isFetching: isFetchingQuestions,
    isError: isErrorQuestions,
    error: errorQuestions,
    refetch: refetchQuestions,
  } = useGetFormByIdQuery(
    {
      id: formId!,
    },
    { skip: false }
  )
  // const {
  //   data: resultRelationShip,
  //   isLoading: isLoadingResultRelationShip,
  //   isFetching: isFetchingResultRelationShip,
  //   isError: isErrorResultRelationShip,
  //   error: errorResultRelationShip,
  // } = useGetFormRelationshipQuery(
  //   {
  //     id: formId!,
  //   },
  //   { skip: !isSkip }
  // )
  const [addFeedback, { isLoading: isLoadingAddFeedback }] = useAddFeedbackMutation()

  // states
  const [reviewQuestions, setReviewQuestions] = useState(questions?.reviewQuestions || [])
  const [answerQuestions, setAnswerQuestions] = useState(questions?.answerQuestions || [])
  const [questionErrorIndex, setQuestionErrorIndex] = useState<string | undefined>(undefined)
  const [questionType, setQuestionType] = useState<string>('')

  // functions
  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        let result = Object.keys(values)
          .filter((key) => key.startsWith('question_'))
          .map((key) => ({
            question: key.slice('question_'.length),
            type: ResultTypes.TEXT,
            point: defaultPoint,
            answer: values[key],
          }))
        const answerPoints = formStates.answerQuestions.filter(
          (item) => item.type === ResultTypes.POINT
        )
        result = [...answerPoints, ...result]

        const reviewErrorIndex = getFirstEmptyReviewQuestion(formStates)
        const answerErrorIndex = getFirstEmptyAnswerQuestion(result)

        if (reviewErrorIndex) {
          setQuestionErrorIndex(reviewErrorIndex)
          setQuestionType(QuestionTypes.REVIEW)
          const errElm = document.querySelector('.first-question-error-field')
          if (errElm) {
            errElm.scrollIntoView({ behavior: 'smooth', block: 'end' })
          }
          return
        }
        if (answerErrorIndex) {
          setQuestionErrorIndex(answerErrorIndex)
          setQuestionType(QuestionTypes.ANSWER)
          const errElm = document.querySelector('.first-question-error-field')
          if (errElm) {
            errElm.scrollIntoView({ behavior: 'smooth', block: 'end' })
          }
          return
        }

        const submitValues = {
          relationship_id: formId!,
          fullname: values.fullname,
          position: values.position,
          form:
            // resultRelationShip?.result?._id ||
            questionsResult?.result?._id!,
          relationship:
            // resultRelationShip?.result?.relationship ||
            questionsResult?.result?.relationship || relations[0].value,
          result: [...formStates.reviewQuestions, ...result],
          // .map((item) => ({
          //   ...item,
          //   point: item.point === maxLengthLevels ? defaultPoint : item.point,
          // })),
        }

        // console.log('submitValues: ', submitValues)
        // return

        addFeedback(submitValues)
          .then((res: any) => {
            if (res?.data?.status === ResponseStatus.Success) {
              notification.success({
                message: (
                  <Typography.Text
                    style={{
                      fontSize: 14,
                    }}
                  >
                    {toastMessages.feedbackSuccessfully}
                  </Typography.Text>
                ),
              })
              refetchQuestions()
            } else
              notification.error({
                message: (
                  <Typography.Text
                    style={{
                      fontSize: 14,
                    }}
                  >
                    {res?.error?.data?.error ??
                      (res?.error?.statusText as string) ??
                      toastMessages.feedbackFailed}
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
                  {err?.data?.error ?? (err.statusText as string) ?? toastMessages.feedbackFailed}
                </Typography.Text>
              ),
            })
          })
      })
      .catch(
        (err) =>
          new Promise((resolve) => {
            setTimeout(() => resolve(err), 200)
            console.log(err)
          })
      )
      .then(() => {
        const errElm = document.querySelector('.ant-form-item-has-error')
        if (errElm) {
          errElm.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      })
      .catch((err) => console.log(err))
  }

  useEffect(() => {
    if (checkExpiredToken()) dispatch(logout())
  }, [])

  useEffect(() => {
    if (!isEmpty(questionsResult?.result?.template.template)) {
      setQuestions(questionsResult.result.template.template)
      const resultReviewQuestions = questionsResult.result.template.template?.questions || []

      setReviewQuestions(resultReviewQuestions)

      const convertedAnswerQuestions =
        questionsResult.result.template.template?.answerQuestions || []
      setAnswerQuestions(convertedAnswerQuestions)

      const convertedReviewQuestions =
        getQuestions()?.questions.flatMap((section: QuestionNewType) =>
          section.children.flatMap((child) =>
            child.questions.map((question) => ({
              ...question,
              sectionTitle: section.title,
              childTitle: child.title,
            }))
          )
        ) || []

      const convertedData: FormState = {
        reviewQuestions:
          convertedReviewQuestions?.map((item: Question) => ({
            question: item?._id,
            type: item?.type,
            point: defaultPoint,
            answer: defaultAnswer,
          })) || [],
        answerQuestions:
          getQuestions()?.answerQuestions?.map((item: Question) => ({
            question: item?._id,
            type: item?.type,
            point: item?.type === ResultTypes.POINT ? defaultPoint : 0,
            answer: defaultAnswer,
          })) || [],
      }
      dispatch(setState(convertedData))
    }
    if (questionsResult?.result?.user) {
      form.setFieldValue('fullname', questionsResult?.result?.user?.fullname || '')
      form.setFieldValue('position', questionsResult?.result?.user?.position || '')
    }
  }, [questionsResult])

  // handle get error
  useEffect(() => {
    if (isErrorQuestions) {
      notification.error({
        message: (
          <Typography.Text
            style={{
              fontSize: 14,
            }}
          >
            {'Có lỗi khi lấy dữ liệu biểu mẫu'}
          </Typography.Text>
        ),
      })
      removeQuestions()
    }
    // if (isErrorResultRelationShip) {
    //   notification.error({
    //     message: (
    //       <Typography.Text
    //         style={{
    //           fontSize: 14,
    //         }}
    //       >
    //         {(errorResultRelationShip as ResponseError)?.statusText}
    //       </Typography.Text>
    //     ),
    //   })
    // }
  }, [
    isErrorQuestions,
    // , isErrorResultRelationShip
  ])

  return (
    <Spin
      spinning={
        isLoadingQuestions || isFetchingQuestions
        //  ||
        // isLoadingResultRelationShip ||
        // isFetchingResultRelationShip
      }
    >
      {/* Header */}
      <Space
        direction="vertical"
        style={{
          width: '100%',
          marginBottom: APP_LAYOUT_GUTTER_SIZE_20,
        }}
        size={[0, 0]}
      >
        <Row
          style={{
            backgroundColor: APP_COLOR_PRIMARY,
            marginBottom: APP_LAYOUT_GUTTER_SIZE_20,
            padding: `${APP_LAYOUT_GUTTER_SIZE / 2}px 0`,
          }}
        >
          <Col
            xs={{
              span: 22,
              offset: 1,
            }}
            sm={{
              span: 22,
              offset: 1,
            }}
            md={{
              span: 20,
              offset: 2,
            }}
            lg={{
              span: 20,
              offset: 2,
            }}
            xl={{
              span: 16,
              offset: 4,
            }}
            xxl={{
              span: 10,
              offset: 7,
            }}
          >
            <img
              src={PAGE_INFO.LOGO}
              alt={'logo'}
              draggable={false}
              onClick={() => {
                navigate(rc(RouteKey.Form).path)
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col
            xs={{
              span: 22,
              offset: 1,
            }}
            sm={{
              span: 22,
              offset: 1,
            }}
            md={{
              span: 20,
              offset: 2,
            }}
            lg={{
              span: 20,
              offset: 2,
            }}
            xl={{
              span: 16,
              offset: 4,
            }}
            xxl={{
              span: 10,
              offset: 7,
            }}
          >
            <Title
              className={styles.relativeText}
              style={{
                textTransform: 'uppercase',
                fontSize: getFSFromType(FontType.HEADER),
                marginBottom: 0,
                width: 'fit-content',
              }}
            >
              Phản hồi 360
              <span>
                <Title
                  className={styles.absoluteText}
                  style={{
                    fontSize: getFSFromType(FontType.CONTENT),
                  }}
                >
                  O
                </Title>
              </span>
            </Title>
          </Col>
        </Row>
      </Space>

      {/* Body */}
      <Row
        style={{
          paddingBottom: APP_LAYOUT_GUTTER_SIZE_20 + 46,
        }}
      >
        <Col
          xs={{
            span: 22,
            offset: 1,
          }}
          sm={{
            span: 22,
            offset: 1,
          }}
          md={{
            span: 20,
            offset: 2,
          }}
          lg={{
            span: 20,
            offset: 2,
          }}
          xl={{
            span: 16,
            offset: 4,
          }}
          xxl={{
            span: 10,
            offset: 7,
          }}
        >
          {/* Body */}
          <Space direction="vertical" size={[0, 0]} style={{ width: '100%' }}>
            <Form form={form}>
              <Space
                direction="vertical"
                size={[APP_LAYOUT_GUTTER_SIZE_4, APP_LAYOUT_GUTTER_SIZE_4]}
              >
                <Text>
                  Chào mừng anh/chị đến với chương trình Phản hồi{' '}
                  <Text className={styles.relativeText} style={{ marginRight: 10 }}>
                    360
                    <Text className={styles.absoluteText2}>o</Text>
                  </Text>
                  dành cho:
                </Text>
                <Row gutter={[APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE / 3]}>
                  <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                    <Form.Item
                      name="fullname"
                      label={
                        <Text strong italic>
                          Anh/chị
                        </Text>
                      }
                      style={{ marginBottom: 0 }}
                      rules={[{ required: true, message: toastMessages.requiredMessage }]}
                      className="custom-form-item"
                    >
                      <Input
                        size="small"
                        placeholder="..."
                        className="customInputTransparent"
                        disabled
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                    <Form.Item
                      name="position"
                      label={
                        <Text strong italic>
                          Chức vụ
                        </Text>
                      }
                      style={{ marginBottom: 0 }}
                      rules={[{ required: true, message: toastMessages.requiredMessage }]}
                      className="custom-form-item"
                    >
                      <Input
                        size="small"
                        placeholder="..."
                        className="customInputTransparent"
                        disabled
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Space
                  direction="vertical"
                  size={[APP_LAYOUT_GUTTER_SIZE_6, APP_LAYOUT_GUTTER_SIZE_6]}
                  style={{ marginTop: APP_LAYOUT_GUTTER_SIZE_8 }}
                >
                  <Text>
                    <Text strong>Anh chị</Text> vui lòng chọn "{<Icon.CheckOutlined />}" một trong
                    năm mức độ trả lời các câu hỏi bên dưới, nhằm{' '}
                    <Text strong>góp ý xây dựng</Text> cho các anh/chị được khảo sát (gồm 50 câu
                    hỏi):
                  </Text>
                  <Text>Mức 1 = Thấp nhất, Mức 5 = Cao nhất,</Text>
                  {/* <Text>
                    Nếu anh/chị chưa đủ thông tin để nhận xét thì chọn vào{' '}
                    <Text strong>"Không ý kiến"</Text>
                  </Text>{' '} */}
                  <Text italic>
                    Nhận xét không nhằm mục đích phân định đúng sai, nên anh/chị cần chia sẻ đúng
                    suy nghĩ thật sự của mình để{' '}
                    <Text strong>"Người Được Phản Hồi" ("NĐPH")</Text> biết được nhìn nhận thật
                    của mọi người xung quanh một cách chân thành nhất, để NĐPH cân nhắc phát huy
                    hoặc điều chỉnh cho hiệu quả hơn, mọi ý kiến xây dựng đều được trân trọng.
                  </Text>
                  <Text italic>
                    Lưu ý: Phản hồi của anh/chị là hoàn toàn bảo mật vì những lý do sau:
                  </Text>
                  <ul style={{ paddingLeft: 14 }}>
                    <li>
                      <Text italic>
                        <Text strong>Không yêu cầu đăng nhập: </Text>
                        Công cụ được thiết kế sử dụng mà không cần tài khoản hay thông tin đăng
                        nhập, đảm bảo không có dữ liệu người dùng nào được lưu trữ. Khuyến khích
                        người dùng sử dụng chế độ riêng tư trên trình duyệt (Incognito trên Chrome
                        và InPrivate trên Microsoft Edge) để đảm bảo sự riêng tư và ẩn danh của
                        quá trình đánh giá.
                      </Text>
                    </li>
                    <li>
                      <Text italic>
                        <Text strong>Không lưu địa chỉ IP: </Text>
                        Hệ thống được cấu hình để không ghi lại hoặc lưu trữ địa chỉ IP của người
                        gửi phản hồi, ngăn chặn khả năng truy ngược đánh giá đến một thiết bị cụ
                        thể.{' '}
                      </Text>
                    </li>
                  </ul>
                </Space>

                <Space
                  direction="vertical"
                  size={[APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE]}
                  style={{ width: '100%' }}
                >
                  {/* Thông tin mối quan hệ của anh/chị với NĐPH */}
                  <Space
                    direction="vertical"
                    size={[APP_LAYOUT_GUTTER_SIZE_2, APP_LAYOUT_GUTTER_SIZE_2]}
                    style={{ width: '100%' }}
                  >
                    <Title
                      style={{
                        fontSize: getFSFromType(FontType.TITLE),
                        color: APP_COLOR_SECONDARY,
                      }}
                    >
                      A. Thông tin mối quan hệ của anh/chị với NĐPH
                    </Title>
                    <Radio.Group
                      style={{
                        width: '100%',
                      }}
                      value={
                        // resultRelationShip?.result?.relationship ||
                        questionsResult?.result?.relationship || relations[0]?.value
                      }
                      disabled
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
                  </Space>
                  <Divider className={styles.customDivider} />

                  {/* Nội dung nhận xét của anh/chị về NĐPH */}
                  <Space
                    direction="vertical"
                    size={[APP_LAYOUT_GUTTER_SIZE_2, APP_LAYOUT_GUTTER_SIZE_2]}
                    style={{ width: '100%' }}
                  >
                    <Title
                      style={{
                        fontSize: getFSFromType(FontType.TITLE),
                        color: APP_COLOR_SECONDARY,
                      }}
                    >
                      B. Nội dung nhận xét của anh/chị về NĐPH
                    </Title>
                  </Space>
                  <Space
                    direction="vertical"
                    size={[APP_LAYOUT_GUTTER_SIZE_20, APP_LAYOUT_GUTTER_SIZE_20]}
                    style={{ width: '100%' }}
                  >
                    {reviewQuestions?.map((item: QuestionNewType, index: number) => (
                      <div key={index}>
                        <Title
                          style={{
                            fontSize: getFSFromType(FontType.SUB_TITLE),
                            color: APP_COLOR_PRIMARY,
                            marginBottom: 2,
                          }}
                        >
                          {item.title}
                        </Title>
                        {item.children?.map((subItem: Children, subIndex: number) => (
                          <div
                            key={subIndex}
                            style={{ marginTop: subIndex > 0 ? APP_LAYOUT_GUTTER_SIZE_20 : 0 }}
                          >
                            <Title
                              style={{
                                fontSize: getFSFromType(FontType.SUB_TITLE),
                                color: APP_COLOR_PRIMARY,
                                marginBottom: 2,
                              }}
                            >
                              {subItem.title}
                            </Title>
                            {subItem.questions?.map((question: QuestionChildren, i: number) => (
                              <div
                                key={question._id}
                                style={{ marginTop: i > 0 ? APP_LAYOUT_GUTTER_SIZE_20 / 2 : 0 }}
                              >
                                <Title
                                  style={{
                                    fontSize: getFSFromType(FontType.SUB_TITLE),
                                    color: APP_COLOR_PRIMARY,
                                    marginBottom: 2,
                                  }}
                                >
                                  {`${subIndex + 1}.${i + 1}`}. {question.title}
                                </Title>
                                {question?.content && (
                                  <p
                                    dangerouslySetInnerHTML={{
                                      __html: (question.content || '-').replace(/\n/g, '<br />'),
                                    }}
                                    style={{
                                      fontSize: getFSFromType(FontType.CONTENT),
                                      fontStyle: 'italic',
                                    }}
                                  />
                                )}
                                <LevelsTable
                                  showLabel={true}
                                  handleChange={(value) =>
                                    dispatch(
                                      setFieldValue({
                                        fieldName: 'reviewQuestions',
                                        value: value,
                                        question: question._id,
                                      })
                                    )
                                  }
                                  value={
                                    getReviewValueByQuestion(formStates, question._id)?.point ??
                                    defaultPoint
                                  }
                                />
                                {question._id === questionErrorIndex &&
                                  questionType === QuestionTypes.REVIEW && <ErrorMessage />}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </Space>
                  <Divider className={styles.customDivider} />

                  {/* Anh/chị hãy trả lời những câu hỏi sau */}
                  <Space
                    direction="vertical"
                    size={[APP_LAYOUT_GUTTER_SIZE_2, APP_LAYOUT_GUTTER_SIZE_2]}
                    style={{ width: '100%' }}
                  >
                    <Title
                      style={{
                        fontSize: getFSFromType(FontType.TITLE),
                        color: APP_COLOR_SECONDARY,
                      }}
                    >
                      C. Anh/chị hãy trả lời những câu hỏi sau
                    </Title>
                    <Space
                      direction="vertical"
                      size={[APP_LAYOUT_GUTTER_SIZE_20, APP_LAYOUT_GUTTER_SIZE_20]}
                      style={{ width: '100%' }}
                    >
                      {answerQuestions?.map((item: Question, index: number) => (
                        <div key={index}>
                          <Title
                            style={{
                              fontSize: getFSFromType(FontType.SUB_TITLE),
                              color: APP_COLOR_PRIMARY,
                              marginBottom: 4,
                            }}
                          >
                            {index + 1}. {item.title}
                          </Title>
                          {item.type === ResultTypes.POINT ? (
                            <>
                              <LevelsTable
                                showLabel={false}
                                handleChange={(value) =>
                                  dispatch(
                                    setFieldValue({
                                      fieldName: 'answerQuestions',
                                      value: value,
                                      question: item._id,
                                    })
                                  )
                                }
                                value={
                                  getAnswerValueByQuestion(formStates, item._id)?.point ??
                                  defaultPoint
                                }
                              />
                              {item._id === questionErrorIndex &&
                                questionType === QuestionTypes.ANSWER && <ErrorMessage />}
                            </>
                          ) : (
                            <Form.Item
                              name={`question_${item._id}`}
                              style={{ marginBottom: 0, marginTop: 2 }}
                              rules={[{ required: true, message: toastMessages.requiredMessage }]}
                              className="custom-form-item"
                            >
                              <TextArea
                                value={
                                  getAnswerValueByQuestion(formStates, item._id)?.answer ??
                                  defaultAnswer
                                }
                                autoSize={{ minRows: 5, maxRows: 18 }}
                                className="custom-textarea"
                                // onChange={(e) =>
                                //   dispatch(
                                //     setFieldValue({
                                //       fieldName: 'answerQuestions',
                                //       value: e.target.value,
                                //       question: item._id,
                                //     })
                                //   )
                                // }
                                style={{ marginBottom: 2 }}
                                placeholder="..."
                              />
                            </Form.Item>
                          )}
                        </div>
                      ))}
                    </Space>
                  </Space>

                  {/* Button submit */}
                  <Button
                    key="submit"
                    type="primary"
                    onClick={handleSubmit}
                    block
                    disabled={isLoadingAddFeedback || questionsResult?.result?.isSubmitted}
                    loading={isLoadingAddFeedback}
                    size="large"
                    style={{
                      backgroundColor:
                        isLoadingAddFeedback || questionsResult?.result?.isSubmitted
                          ? 'unset'
                          : APP_COLOR_PRIMARY,
                      borderRadius: BORDER_RADIUS,
                    }}
                  >
                    {questionsResult?.result?.isSubmitted
                      ? labelText.expiredLink
                      : labelText.send}
                  </Button>
                </Space>
              </Space>
            </Form>
          </Space>
        </Col>
      </Row>

      {/* Footer */}
      <Row
        style={{
          backgroundColor: APP_COLOR_PRIMARY,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      >
        <Col
          xs={{
            span: 22,
            offset: 1,
          }}
          sm={{
            span: 22,
            offset: 1,
          }}
          md={{
            span: 20,
            offset: 2,
          }}
          lg={{
            span: 20,
            offset: 2,
          }}
          xl={{
            span: 16,
            offset: 4,
          }}
          xxl={{
            span: 10,
            offset: 7,
          }}
        >
          <AppFooter />
        </Col>
      </Row>
    </Spin>
  )
}

export default FormPage
