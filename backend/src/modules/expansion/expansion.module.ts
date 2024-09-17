/**
 * @file Expansion module
 * @module module/expansion/module
 */

import { Module } from "@nestjs/common";
import { ExpansionController } from "./expansion.controller";
import { StatisticService } from "./expansion.service.statistic";
import { DBBackupService } from "./expansion.service.dbbackup";

@Module({
  imports: [],
  controllers: [ExpansionController],
  providers: [StatisticService, DBBackupService],
  exports: [StatisticService, DBBackupService],
})
export class ExpansionModule {}
