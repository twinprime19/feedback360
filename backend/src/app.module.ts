/**
 * @file App module
 * @module app/module
 */

import { APP_INTERCEPTOR, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "@app/app.controller";

// framework
import { HttpCacheInterceptor } from "@app/interceptors/cache.interceptor";
import { ValidationPipe } from "@app/pipes/validation.pipe";

// middlewares
import { CorsMiddleware } from "@app/middlewares/cors.middleware";
import { OriginMiddleware } from "@app/middlewares/origin.middleware";

// universal modules
import { DatabaseModule } from "@app/processors/database/database.module";
import { CacheModule } from "@app/processors/cache/cache.module";
import { HelperModule } from "@app/processors/helper/helper.module";

// BIZ helper module
import { ExpansionModule } from "@app/modules/expansion/expansion.module";

// BIZ modules
import { SeedsModule } from "./seeds/seeds.module";
import { AuthModule } from "@app/modules/auth/auth.module";
import { UserModule } from "@app/modules/user/user.module";
import { RoleModule } from "./modules/role/role.module";
import { PermissionModule } from "./modules/permission/permission.module";
import { MediaModule } from "./modules/media/media.module";
import { SettingModule } from "./modules/settting/setting.module";
import { TemplateModule } from "./modules/template/template.module";
import { FormModule } from "./modules/form/form.module";
import { QuestionModule } from "./modules/question/question.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";

@Module({
  imports: [
    // https://github.com/nestjs/throttler#readme
    ThrottlerModule.forRoot({
      ttl: 60 * 5, // 5 minutes
      limit: 300, // 300 limit
      ignoreUserAgents: [/googlebot/gi, /bingbot/gi, /baidubot/gi],
    }),
    HelperModule,
    DatabaseModule,
    CacheModule,
    ExpansionModule,
    // BIZs
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    SeedsModule,
    MediaModule,
    SettingModule,
    TemplateModule,
    FormModule,
    QuestionModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware, OriginMiddleware).forRoutes("*");
  }
}
