import React, { useEffect, useRef, useState } from 'react'
import SunEditor from 'suneditor-react'
import 'suneditor/dist/css/suneditor.min.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Button, Space } from 'antd'
import * as Icon from '@ant-design/icons'

import { copy } from '@/services/clipboard'
import './styles.less'
import { EmailParamsArr } from '@/constants/emailTemplate'
import { APP_LAYOUT_GUTTER_SIZE_16, DEFAULT_FONT_FAMILY } from '@/config'

const editorOptions = {
  height: 200,
  buttonList: [
    ['undo', 'redo'],
    ['removeFormat'],
    ['bold', 'underline', 'italic', 'fontSize'],
    ['fontColor', 'hiliteColor'],
    ['align', 'horizontalRule', 'list'],
    ['table', 'link', 'image', 'imageGallery'],
    ['showBlocks', 'codeView'],
    ['math'],
  ],
  katex: katex,
  imageRotation: false,
  fontSize: [12, 14, 16, 18, 20],
  colorList: [
    [
      '#828282',
      '#FF5400',
      '#676464',
      '#F1F2F4',
      '#FF9B00',
      '#F00',
      '#fa6e30',
      '#000',
      'rgba(255, 153, 0, 0.1)',
      '#FF6600',
      '#0099FF',
      '#74CC6D',
      '#FF9900',
      '#CCCCCC',
    ],
  ],
}

interface EditorProps {
  handleAction?: (value: any) => void
  defaultData: any
  hideToolbar: boolean
  disabled: boolean
}

export const Editor = ({ handleAction, defaultData, hideToolbar, disabled }: EditorProps) => {
  const copyData = EmailParamsArr
  const editorRef = useRef<any>()
  const [value, setValue] = useState('')

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setContents(defaultData)
    }
  }, [editorRef, defaultData])

  const onChangeHandler = (content: string) => {
    setValue(content)
  }

  const getSunEditorInstance = (sunEditor: any) => {
    editorRef.current = sunEditor
  }

  useEffect(() => {
    if (handleAction) {
      handleAction(value)
    }
  }, [value])

  return (
    <div className="custome-editor">
      <SunEditor
        disable={disabled}
        hideToolbar={hideToolbar}
        setOptions={editorOptions as any}
        onChange={onChangeHandler}
        getSunEditorInstance={getSunEditorInstance}
        setDefaultStyle={`font-family: ${DEFAULT_FONT_FAMILY}`}
      />
      {!disabled && (
        <div
          style={{
            width: 'max-content',
            maxWidth: '100%',
            marginTop: 12,
            backgroundColor: '#f4f4f4',
            borderRadius: 5,
            padding: '10px 16px',
          }}
        >
          <div style={{ marginBottom: 6 }}>Những trường có sẵn</div>
          <Space size={[APP_LAYOUT_GUTTER_SIZE_16 * 2, 3]} wrap>
            {copyData.map((param) => (
              <Button
                key={param}
                loading={false}
                type="primary"
                icon={<Icon.CopyOutlined />}
                style={{ border: 'none', padding: 0, color: '#000', height: 'unset' }}
                iconPosition="end"
                ghost
                onClick={() => copy(param)}
              >
                {param}
              </Button>
            ))}
          </Space>
        </div>
      )}
    </div>
  )
}
