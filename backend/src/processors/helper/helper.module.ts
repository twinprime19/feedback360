/**
 * @file General helper module
 * @module processor/helper/module
 */

import { Module, Global } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { GoogleService } from './helper.service.google'
import { AWSService } from './helper.service.aws'
import { EmailService } from './helper.service.email'
import { SeoService } from './helper.service.seo'
import { IPService } from './helper.service.ip'

const services = [GoogleService, AWSService, EmailService, SeoService, IPService]

@Global()
@Module({
  imports: [HttpModule],
  providers: services,
  exports: services,
})
export class HelperModule {}
