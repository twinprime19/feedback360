/**
 * @file App entry
 * @module app/main
 */

import helmet from 'helmet'
import passport from 'passport'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '@app/app.module'
import { VersioningType } from '@nestjs/common'
import { HttpExceptionFilter } from '@app/filters/error.filter'
import { TransformInterceptor } from '@app/interceptors/transform.interceptor'
import { LoggingInterceptor } from '@app/interceptors/logging.interceptor'
import { ErrorInterceptor } from '@app/interceptors/error.interceptor'
import { environment, isProdEnv } from '@app/app.environment'
import logger from '@app/utils/logger'
import * as APP_CONFIG from '@app/app.config'

async function bootstrap() {
  // MARK: keep logger enabled on dev env
  const app = await NestFactory.create(AppModule, isProdEnv ? { logger: false } : {})
  // app.enableCors({
  //   "origin": "https://insta.demo.zinisoft.net",
  //   "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  //   "preflightContinue": false,
  //   "optionsSuccessStatus": 204
  // })
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1.0'
  })
  app.use(helmet())
  app.use(compression())
  app.use(cookieParser())
  app.use(bodyParser.json({ limit: '10mb' }))
  app.use(bodyParser.urlencoded({ extended: true }))
  // MARK: keep v0.5 https://github.com/jaredhanson/passport/blob/master/CHANGELOG.md#changed
  app.use(passport.initialize())
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new TransformInterceptor(), new ErrorInterceptor(), new LoggingInterceptor())
  // https://github.com/nestjs/nest/issues/528#issuecomment-403212561
  // https://stackoverflow.com/a/60141437/6222535
  // MARK: can't used!
  // useContainer(app.select(AppModule), { fallbackOnErrors: true, fallback: true })
  return await app.listen(APP_CONFIG.APP.PORT)
}

bootstrap().then(() => {
  logger.info(`Tool feedback is running at ${APP_CONFIG.APP.PORT}, env: ${environment}.`)
})
