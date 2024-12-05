import React from 'react'

import { FormTypes } from '@/models/form'
import { UserForm } from '../components/Form'

export function CreateUser() {
  return <UserForm formType={FormTypes.CREATE} />
}
