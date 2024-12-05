import { labelText } from '@/constants/messages'
import { Button, Space, Typography } from 'antd'
import React from 'react'

interface Props {
  countItem: number
  handleDelete: () => void
}

export default function DeleteNav({ countItem, handleDelete }: Props) {
  return (
    <>
      <Space
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#E9F7FE',
          marginBottom: 24,
        }}
      >
        <Typography.Text>{`${labelText.selected} ${countItem} ${labelText.item}`}</Typography.Text>
        <Button
          type="primary"
          style={{ border: 'none', color: '#f00' }}
          ghost
          onClick={handleDelete}
        >
          {labelText.delete}
        </Button>
      </Space>
    </>
  )
}
