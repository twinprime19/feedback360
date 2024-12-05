export enum Relation {
  SELF = 0,
  PEER = 1,
  SUB = 2,
  SUP = 3,
}

export const relations = [
  {
    name: 'Tự nhận xét',
    value: Relation.SELF,
  },
  {
    name: 'Ngang hàng',
    value: Relation.PEER,
  },

  {
    name: 'Cấp dưới',
    value: Relation.SUB,
  },

  {
    name: 'Cấp trên',
    value: Relation.SUP,
  },
]

export const getRelationFromVal = (value: Relation) =>
  relations.find((item) => item.value === value) || null
