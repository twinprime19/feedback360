import React from 'react'

import { FormTypes } from '@/models/form'
import { UserForm } from '../components/Form'

export function UpdateUser() {
  return <UserForm formType={FormTypes.UPDATE} />
}
