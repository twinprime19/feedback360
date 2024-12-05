export enum MailSendingStatus {
  Successfully = 250,
  Failed = 501,
}

const mailSendingStatusMap = new Map(
  [
    {
      id: MailSendingStatus.Successfully,
      name: 'success',
    },
    {
      id: MailSendingStatus.Failed,
      name: 'error',
    },
  ].map((item) => [item.id, item])
)

export const getMailSendingStatus = (status: MailSendingStatus, isProcessing: boolean) => {
  if (status === MailSendingStatus.Successfully && isProcessing) {
    return {
      id: MailSendingStatus.Successfully,
      name: 'warning',
    }
  }

  return mailSendingStatusMap.get(status)
}
