/* eslint-disable */

import React from 'react'
import './styles.less'
import { APP_LAYOUT_GUTTER_SIZE_20, APP_LAYOUT_GUTTER_SIZE_4 } from '@/config'

export const AppFooter = () => {
  return (
    <div
      style={{
        padding: `${APP_LAYOUT_GUTTER_SIZE_20 / 2}px 0`,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: APP_LAYOUT_GUTTER_SIZE_4,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 10,
          height: 12,
        }}
      >
        Công ty CP Bất động sản Tiến Phước
      </div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontWeight: 300,
              fontSize: 8,
            }}
          >
            542 Trần Hưng Đạo, Quận 5, TP.HCM
          </span>
          <div
            style={{
              backgroundColor: 'white',
              height: 4,
              width: 4,
              borderRadius: '100%',
            }}
          ></div>
          <span
            style={{
              fontWeight: 300,
              fontSize: 8,
            }}
          >
            +(84-28) 3838 0303
          </span>
          <div
            style={{
              backgroundColor: 'white',
              height: 4,
              width: 4,
              borderRadius: '100%',
            }}
          ></div>
          <span
            style={{
              fontWeight: 300,
              fontSize: 8,
            }}
          >
            info@tienphuoc.com
          </span>
        </div>
      </div>
    </div>
  )
}
