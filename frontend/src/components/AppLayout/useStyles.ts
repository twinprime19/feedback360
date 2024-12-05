import { APP_COLOR_PRIMARY, APP_LAYOUT_GUTTER_SIZE, APP_LAYOUT_GUTTER_SIZE_16 } from '@/config'
import { theme } from 'antd'
import { CSSProperties } from 'react'

export const useStyles = () => {
  const { token } = theme.useToken()

  const styles: Record<
    | 'appLayout'
    | 'headerLayout'
    | 'header'
    | 'logo'
    | 'menu'
    | 'contentLayout'
    | 'contentLayoutMobile'
    | 'footerLayout',
    CSSProperties
  > = {
    appLayout: {
      minHeight: '100vh',
    },
    headerLayout: {
      backgroundColor: token.colorBgBase,
      paddingLeft: 'max(16px,2%)',
      paddingRight: 'max(16px,2%)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '100%',
      width: '100%',
      gap: 20,
    },
    logo: {
      height: '60%',
      cursor: 'pointer',
    },
    menu: {
      height: '100%',
      width: 50,
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignContent: 'center',
      fontWeight: '700',
    },
    contentLayout: {
      paddingBlock: APP_LAYOUT_GUTTER_SIZE_16,
      paddingInline: `max(${APP_LAYOUT_GUTTER_SIZE}px, ${APP_LAYOUT_GUTTER_SIZE}px)`,
    },
    contentLayoutMobile: {
      paddingBlock: 0,
      paddingInline: 'max(0px, 0px)',
    },
    footerLayout: {
      backgroundColor: APP_COLOR_PRIMARY,
      paddingLeft: 'max(16px,2%)',
      paddingRight: 'max(16px,2%)',
    },
  }

  return styles
}
