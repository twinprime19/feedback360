/**
 * @desc App auth interceptor component

 */
import React, { ReactNode, useEffect } from 'react'
import styles from './style.module.less'
import { rc, RouteKey } from '@/routes'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { notification, theme, Typography } from 'antd'
import { isEmpty } from 'lodash'
import { getLoggedUser } from '@/services/loggedUser'
import { useValidateTokenQuery } from '@/pages/Login/apiSlice'
import { logout, setUserState } from '@/pages/Login/slice'
import { checkExpiredToken, getToken } from '@/services/token'
import { toastMessages } from '@/constants/messages'

export const AppAuth = (props: { children: (isSuperAdmin: boolean) => ReactNode }) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const { loggedUser } = useAppSelector((state) => state.auth)
  const loggedUserStorage = getLoggedUser()

  const isSkipValidate = !isEmpty(loggedUserStorage)

  // query
  const {
    data: user,
    isError: isErrorValidateToken,
    isSuccess: isSuccessValidateToken,
  } = useValidateTokenQuery({}, { skip: isSkipValidate })

  const userData = isSkipValidate ? (!isEmpty(loggedUser) ? loggedUser : loggedUserStorage) : user

  // handle unauthenticated user
  useEffect(() => {
    if (isErrorValidateToken) {
      console.log(`offline mode`)
      dispatch(logout())
      navigate(rc(RouteKey.Login).path)
    }
  }, [isErrorValidateToken])

  useEffect(() => {
    if (getToken() && !checkExpiredToken()) {
      dispatch(setUserState())
    } else {
      notification.warning({
        message: (
          <Typography.Text
            style={{
              fontSize: 14,
            }}
          >
            {toastMessages.endLoginSession}
          </Typography.Text>
        ),
      })
      dispatch(logout())
      navigate(rc(RouteKey.Login).path)
    }
  }, [])
  return (
    <div>
      {isSuccessValidateToken || isSkipValidate ? (
        <div className={styles.authContainer}>{props.children(userData?.isSuperAdmin)}</div>
      ) : (
        <div className={styles.loading}>
          <div className={styles.animation}>
            {Array.from(Array(9).keys()).map((value) => (
              <div key={value} style={{ backgroundColor: token.colorPrimary }}></div>
            ))}
          </div>
          <Typography.Text className={styles.text}>Initializing</Typography.Text>
        </div>
      )}
    </div>
  )
}

export const ForbiddenPage = ({ isSuperAdmin }: { isSuperAdmin: boolean }) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (isSuperAdmin) {
      navigate(rc(RouteKey.User).path)
    } else navigate(rc(RouteKey.Questions).path)
  }, [])

  return (
    <div>
      <div className={styles.forbidden}>
        <div className={styles.title} data-content="403">
          403 - Truy cập bị từ chối
        </div>

        <div className={styles.text}>Ôi, Bạn không có quyền truy cập trang này!</div>
      </div>
    </div>
  )
}
