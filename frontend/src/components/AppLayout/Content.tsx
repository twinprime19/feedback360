import React from 'react'
import { FloatButton } from 'antd'
import * as Icon from '@ant-design/icons'

import { scrollTo } from '@/services/scroller'

export const AppContent: React.FC<any> = (props) => {
  return (
    <div>
      <div>{props?.children}</div>
      <FloatButton.BackTop onClick={() => scrollTo(document.body)}>
        <div>
          <Icon.CaretUpOutlined />
        </div>
      </FloatButton.BackTop>
    </div>
  )
}
