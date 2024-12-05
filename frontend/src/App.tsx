import { StyleProvider } from '@ant-design/cssinjs'
import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom'

import { AppAuth } from './components/AppAuth'
import { AppLayout } from './components/AppLayout'
import { ENABLEd_HASH_ROUTER, ENV, VITE_ENV } from './config'
import { NotFoundPage } from './pages/NotFound'
import { rc, RouteKey } from './routes'
import { store } from './store'
import FormPage from './pages/Form'
import { Login } from './pages/Login'
import { QuestionsPage } from './pages/Questions'
import { UserPage } from './pages/User'
import { CreateUser } from './pages/User/pages/Create'
import { UpdateUser } from './pages/User/pages/Update'
import StatisticsPage from './pages/Statistics'
import { TemplatesPage } from './pages/Templates'
import { ChangePasswordPage } from './pages/ChangePassword'
import { InformationPage } from './pages/Information'

// Router: WORKAROUND for outside
function RouterComponent(props: { children?: React.ReactNode }) {
  return ENABLEd_HASH_ROUTER ? (
    <HashRouter>{props.children}</HashRouter>
  ) : (
    <BrowserRouter>{props.children}</BrowserRouter>
  )
}

export function App() {
  useEffect(() => {
    console.info(`Run! env: ${ENV}, vite env: ${JSON.stringify(VITE_ENV)}`)
  }, [])

  return (
    <StyleProvider hashPriority="high">
      <Provider store={store}>
        <RouterComponent>
          <Routes>
            <Route path={rc(RouteKey.Login).path} element={<Login />} />
            <Route path={rc(RouteKey.Form).path} element={<FormPage />} />

            <Route
              path="/"
              element={
                <AppAuth>
                  {(isSuperAdmin) => (
                    <AppLayout isSuperAdmin={isSuperAdmin}>
                      <Outlet />
                    </AppLayout>
                    //
                  )}
                </AppAuth>
              }
            >
              <Route index={true} element={<Navigate to={rc(RouteKey.Form).path} replace />} />
              <Route path={rc(RouteKey.Questions).path} element={<QuestionsPage />} />
              {/* <Route path={rc(RouteKey.Templates).path} element={<TemplatesPage />} /> */}
              {/* <Route path={rc(RouteKey.Statistics).path} element={<StatisticsPage />} /> */}
              <Route path={rc(RouteKey.Information).path} element={<InformationPage />} />
              <Route path={rc(RouteKey.ChangePassword).path} element={<ChangePasswordPage />} />
              <Route
                path={`${rc(RouteKey.User).path}/*`}
                element={
                  <Routes>
                    <Route
                      index={true}
                      element={<Navigate to={rc(RouteKey.UserList).subPath!} replace />}
                    />
                    <Route path={rc(RouteKey.UserList).subPath} element={<UserPage />} />
                    <Route path={rc(RouteKey.UserCreate).subPath} element={<CreateUser />} />
                    <Route path={rc(RouteKey.UserUpdate).subPath} element={<UpdateUser />} />
                    <Route
                      path="*"
                      element={<Navigate to={rc(RouteKey.UserList).subPath!} replace />}
                    />
                  </Routes>
                }
              />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </RouterComponent>
      </Provider>
    </StyleProvider>
  )
}
