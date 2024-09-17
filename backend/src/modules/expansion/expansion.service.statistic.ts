/**
 * @file Expansion statistic service
 * @module module/expansion/statistic.service
 */

import schedule from "node-schedule";
import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/processors/cache/cache.service";
import logger from "@app/utils/logger";
import { getTodayViewsCount, resetTodayViewsCount } from "./expansion.helper";

const log = logger.scope("ExpansionStatistic");

const DEFAULT_STATISTIC = Object.freeze({
  articles: null,
  comments: null,
  totalViews: null,
  totalLikes: null,
  todayViews: null,
  averageEmotion: null,
});

export type Statistic = Record<keyof typeof DEFAULT_STATISTIC, number | null>;

@Injectable()
export class StatisticService {
  constructor(private readonly cacheService: CacheService) {
    // daily data cleaning at 00:00
    schedule.scheduleJob("1 0 0 * * *", () => {
      resetTodayViewsCount(this.cacheService).catch((error) => {
        log.warn("reset TODAY_VIEWS failed!", error);
      });
    });
  }

  public getStatistic(publicOnly: boolean) {
    const resultData: Statistic = { ...DEFAULT_STATISTIC };
    return Promise.all([
      getTodayViewsCount(this.cacheService).then((value) => {
        resultData.todayViews = value;
      }),
    ])
      .then(() => Promise.resolve(resultData))
      .catch(() => Promise.resolve(resultData));
  }
}
