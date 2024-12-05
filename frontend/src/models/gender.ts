export enum GenderState {
  MALE = 1,
  FEMALE = 2,
}

const genderStateMap = new Map(
  [
    {
      id: GenderState.MALE,
      name: 'Nam',
    },
    {
      id: GenderState.FEMALE,
      name: 'Nữ',
    },
  ].map((item) => [item.id, item])
)

export const getGenderState = (genderState: GenderState) => {
  return genderStateMap.get(genderState)!
}

export const genderStates = Array.from<ReturnType<typeof getGenderState>>(genderStateMap.values())
