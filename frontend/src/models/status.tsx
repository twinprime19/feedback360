/**
 * @file General publish state
 * @author Surmon <https://github.com/surmon-china>
 */

import React from 'react'
import * as Icon from '@ant-design/icons'

export enum ActiveStatus {
  Active = 1,
  Inactive = 0,
}

const activeStatusMap = new Map(
  [
    {
      id: ActiveStatus.Active,
      name: 'active',
      icon: <Icon.CheckOutlined />,
    },
    {
      id: ActiveStatus.Inactive,
      name: 'inactive',
      icon: <Icon.LockOutlined />,
    },
  ].map((item) => [item.id, item])
)

export const getStatus = (status: ActiveStatus) => {
  return activeStatusMap.get(status)!
}

export const activeStatuses = Array.from<ReturnType<typeof getStatus>>(activeStatusMap.values())
