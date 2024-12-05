export enum UserStatus {
  Inactive = 0,
  Active = 1,
}

const userStatusMap = new Map(
  [
    {
      id: UserStatus.Inactive,
      name: 'inactive',
    },
    {
      id: UserStatus.Active,
      name: 'active',
    },
  ].map((item) => [item.id, item])
)

export const getUserStatus = (userStatus: UserStatus) => {
  return userStatusMap.get(userStatus)!
}

export const userStatus = Array.from<ReturnType<typeof getUserStatus>>(userStatusMap.values())
