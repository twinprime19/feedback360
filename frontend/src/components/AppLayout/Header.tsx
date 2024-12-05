import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Dropdown, Avatar, Modal, Spin, MenuProps, Menu, Typography } from 'antd'
import * as Icon from '@ant-design/icons'

import { useAppDispatch, useAppSelector } from '@/hooks'
import { removeToken } from '@/services/token'
import { logout } from '@/pages/Login/slice'
import { rc, RouteKey } from '@/routes'
import { useStyles } from './useStyles'
import './styles.less'
import { SUPERADMIN_LOCATIONS, USER_LOCATIONS } from '.'
import { BASE_PATH } from '@/config'
import { PAGE_INFO } from '@/constants/page'
import { headerLabel, labelText, toastMessages } from '@/constants/messages'

interface AppHeaderProps {
  isSuperAdmin: boolean
}

export const AppHeader: React.FC<AppHeaderProps> = (props) => {
  // hooks
  const styles = useStyles()
  const navigate = useNavigate()
  const location = useLocation()

  // menu item
  const mainMenuItems = [
    {
      key: rc(RouteKey.User).path,
      label: headerLabel.user,
    },
    // {
    //   key: rc(RouteKey.Templates).path,
    //   label: headerLabel.template,
    // },
    {
      key: rc(RouteKey.Questions).path,
      label: headerLabel.question,
    },
  ].filter(
    (r) =>
      (props.isSuperAdmin && SUPERADMIN_LOCATIONS.find((l) => l === r.key)) ||
      (!props.isSuperAdmin && USER_LOCATIONS.find((l) => l === r.key))
  )

  return (
    <div style={styles.header}>
      <img
        style={styles.logo}
        src={PAGE_INFO.LOGO_HORIZONTAL}
        alt={'logo'}
        draggable={false}
        onClick={() => {
          if (props.isSuperAdmin) navigate(rc(RouteKey.User).path)
          else navigate(rc(RouteKey.Questions).path)
        }}
      />

      <Menu
        style={styles.menu}
        theme="light"
        mode="horizontal"
        onClick={(event) => navigate(event.key)}
        selectedKeys={['/' + location.pathname.split('/')[1]]}
        defaultOpenKeys={[rc(RouteKey.Questions).path]}
        items={mainMenuItems}
      />
      <UserDropdown />
    </div>
  )
}

const UserDropdown: React.FC = () => {
  // hook
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const logoutHandler = () => {
    Modal.confirm({
      title: (
        <Typography.Text
          strong
          style={{
            fontSize: 16,
          }}
        >
          {headerLabel.logout}
        </Typography.Text>
      ) as any,
      content: (
        <Typography.Text
          style={{
            fontSize: 14,
          }}
        >
          {toastMessages.logoutMessage}
        </Typography.Text>
      ) as any,
      centered: true,
      onOk() {
        removeToken()
        dispatch(logout())
        navigate(rc(RouteKey.Login).path)
      },
      okText: (
        <Typography.Text
          style={{
            fontSize: 14,
            color: 'white',
          }}
        >
          {headerLabel.logout}
        </Typography.Text>
      ) as any,
      cancelText: (
        <Typography.Text
          style={{
            fontSize: 14,
          }}
        >
          {labelText.cancelText}
        </Typography.Text>
      ) as any,
    })
  }

  const auth = useAppSelector((state) => state.auth)

  return (
    <Spin spinning={false} size="small">
      <Dropdown
        placement="bottomRight"
        menu={{
          items: (auth.loggedUser?.isSuperAdmin
            ? [
                {
                  key: rc(RouteKey.Information).path,
                  icon: <Icon.UserOutlined />,
                  onClick: () => {
                    navigate(rc(RouteKey.Information).path)
                  },
                  label: headerLabel.information,
                },
                {
                  key: 'divider1',
                  type: 'divider',
                },
                {
                  key: rc(RouteKey.ChangePassword).path,
                  icon: <Icon.LockOutlined />,
                  onClick: () => {
                    navigate(rc(RouteKey.ChangePassword).path)
                  },
                  label: headerLabel.changePassword,
                },
                {
                  key: 'divider2',
                  type: 'divider',
                },
                {
                  key: 'logout',
                  icon: <Icon.LogoutOutlined />,
                  onClick: logoutHandler,
                  label: headerLabel.logout,
                },
              ]
            : [
                // {
                //   key: rc(RouteKey.UserInformation).path,
                //   icon: <Icon.ExclamationCircleOutlined />,
                //   onClick: () => {
                //     navigate(rc(RouteKey.UserInformation).path)
                //   },
                //   label: t('header.information'),
                // },
                // {
                //   key: 'divider1',
                //   type: 'divider',
                // },
                // {
                //   key: 'document',
                //   icon: <Icon.FileTextOutlined />,
                //   onClick: () => {
                //     const currentDomain =
                //       window.location.protocol +
                //       '//' +
                //       window.location.hostname +
                //       (window.location.port ? ':' + window.location.port : '')

                //     window.location.href = currentDomain + '/document/index.html'
                //   },
                //   label: t('header.document'),
                // },
                // {
                //   key: 'divider2',
                //   type: 'divider',
                // },

                {
                  key: 'logout',
                  icon: <Icon.LogoutOutlined />,
                  onClick: logoutHandler,
                  label: headerLabel.logout,
                },
              ]) as MenuProps['items'],
        }}
      >
        <div style={{ cursor: 'pointer' }}>
          {auth.loggedUser?.fullname && (
            <Typography.Text className="userDisplayName">
              Xin chào, {auth.loggedUser.fullname}
            </Typography.Text>
          )}
          <Avatar
            shape="square"
            size="small"
            icon={<Icon.UserOutlined />}
            src={
              auth.loggedUser?.avatar?.thumbnail?.path
                ? BASE_PATH + auth.loggedUser.avatar.thumbnail?.path
                : 'avatar'
            }
            style={{ marginLeft: 10 }}
          />
        </div>
      </Dropdown>
    </Spin>
  )
}
