import React from 'react'
import { Modal, Table } from 'antd'

interface Props {
  title?: string
  open: boolean
  handleClose: () => void
  dataSource: any
  columns: { title: string; key?: string; dataIndex?: string; render?: any; fixed?: any }[]
  width?: number
}

export default function ModalSendMailHis({
  title,
  open,
  dataSource,
  handleClose,
  columns,
  width = 1156,
}: Props) {
  return (
    <Modal
      className="modal-backend"
      title={title}
      confirmLoading={false}
      forceRender
      open={open}
      width={width || 1156}
      onCancel={handleClose}
      centered={true}
      footer={null}
    >
      <Table
        className="custom-table"
        scroll={{ x: 'max-content' }}
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
      />
    </Modal>
  )
}
