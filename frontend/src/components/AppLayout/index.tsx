/**
 * @desc App layout

 */

import React from 'react'
import { ConfigProvider, Layout } from 'antd'
import enUS from 'antd/lib/locale/en_US'

import * as CONFIG from '@/config'
import { AppContent } from './Content'
import { useStyles } from './useStyles'
import './styles.less'
import { FontType, getFSFromType } from '@/constants/fontSize'
import { useDeviceType } from '@/hooks/useDeviceType'
import { rc, RouteKey } from '@/routes'
import { useLocation } from 'react-router-dom'
import { ForbiddenPage } from '../AppAuth'
import { AppHeader } from './Header'
import { AppFooter } from './Footer'

export const USER_LOCATIONS = []

export const SUPERADMIN_LOCATIONS = [
  rc(RouteKey.Questions).path,
  rc(RouteKey.User).path,
  rc(RouteKey.UserList).path,
  rc(RouteKey.UserCreate).path,
  rc(RouteKey.UserUpdate).path,
  rc(RouteKey.Templates).path,
  rc(RouteKey.Information).path,
  rc(RouteKey.ChangePassword).path,
]

export const AppLayout = (props: { isSuperAdmin: boolean; children?: React.ReactNode }) => {
  const styles = useStyles()
  const { isMobile, isTablet } = useDeviceType()
  const isSuperAdmin = props?.isSuperAdmin
  const location = useLocation().pathname.split('/')?.[1] ?? ''

  const isForbidden = isSuperAdmin
    ? USER_LOCATIONS.find((l) => l.replace('/', '') === location)
    : SUPERADMIN_LOCATIONS.find((l) => l.replace('/', '') === location)

  return (
    <ConfigProvider
      theme={{
        token: {
          // Seed Token
          colorPrimary: CONFIG.APP_COLOR_PRIMARY,
          borderRadius: CONFIG.BORDER_RADIUS,
        },
        components: {
          Button: {
            colorPrimary: CONFIG.APP_COLOR_PRIMARY,
            borderRadius: CONFIG.BORDER_RADIUS,
          },
          // Table: {
          //   headerBg: CONFIG.APP_COLOR_PRIMARY,
          // },
          Typography: {
            fontSize: getFSFromType(FontType.CONTENT),
            titleMarginTop: 0,
            titleMarginBottom: 0,
          },
        },
      }}
      locale={enUS}
      space={{ size: CONFIG.APP_CONTENT_SPACE_SIZE }}
    >
      <Layout key={enUS.locale} style={styles.appLayout}>
        <Layout.Header style={styles.headerLayout}>
          <AppHeader isSuperAdmin={props.isSuperAdmin} />
        </Layout.Header>
        <Layout.Content
          style={isMobile || isTablet ? styles.contentLayoutMobile : styles.contentLayout}
        >
          <AppContent>
            {isForbidden ? <ForbiddenPage isSuperAdmin={isSuperAdmin} /> : props?.children}
          </AppContent>
        </Layout.Content>
        <Layout.Footer style={{ padding: 0 }}>
          <div style={styles.footerLayout}>
            <AppFooter />
          </div>
        </Layout.Footer>
      </Layout>
    </ConfigProvider>
  )
}
