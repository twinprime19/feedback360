import React from 'react'
import { Button, Modal, Table } from 'antd'
import * as Icon from '@ant-design/icons'

import { APP_COLOR_PRIMARY } from '@/config'

interface Props {
  title?: string
  open: boolean
  setIsOpenHelperModal: React.Dispatch<React.SetStateAction<boolean>>
  onDownloadTemplate: () => void
  isLoadingDelete?: boolean
  dataSource: any
  columns: { title: string; key: string; dataIndex: string }[]
  width?: number
}

export default function ModalHelper({
  title,
  onDownloadTemplate,
  open,
  setIsOpenHelperModal,
  dataSource,
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
      onCancel={() => setIsOpenHelperModal(false)}
      centered={true}
      footer={[
        <Button
          key="submit"
          type="primary"
          size="middle"
          icon={<Icon.DownloadOutlined />}
          onClick={onDownloadTemplate}
          style={{
            backgroundColor: APP_COLOR_PRIMARY,
            width: '100%',
          }}
        >
          Tải bản mẫu
        </Button>,
      ]}
    >
      <div style={{ textAlign: 'left', padding: '16px 0' }}>
        1. Dữ liệu Excel của bạn phải ở định dạng bên dưới. Dòng đầu tiên trong tệp CSV của bạn
        phải là tiêu đề cột như trong ví dụ về bảng. Ngoài ra, hãy đảm bảo rằng tệp của bạn là
        UTF-8 để tránh các sự cố mã hóa không cần thiết. <br />
        2. Nếu cột bạn đang nhập là ngày, hãy đảm bảo cột đó được định dạng ở định dạng DD-MM-YYYY
        (01-01-2024).
        <br />
        3. Các dòng trùng tên tài khoản và email (đối với người dùng) sẽ không được thêm mới khi
        tải lên dữ liệu Excel.
      </div>
      <div>
        <Table
          scroll={{ x: 'max-content' }}
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          bordered
        />
      </div>
    </Modal>
  )
}
