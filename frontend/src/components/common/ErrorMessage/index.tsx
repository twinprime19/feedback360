import { toastMessages } from '@/constants/messages'
import React from 'react'

const ErrorMessage = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
      }}
      className="first-question-error-field"
    >
      <div
        id="question_2_help"
        className="ant-form-item-explain ant-form-item-explain-connected css-dev-only-do-not-override-j9bb5n"
        role="alert"
      >
        <div
          className="ant-form-item-explain-error"
          style={{
            color: '#ff4d4f',
          }}
        >
          {toastMessages.requiredMessage}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
