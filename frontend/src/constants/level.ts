const levelLabels = [
  'Ít khi',
  'Thỉnh thoảng',
  'Thường xuyên',
  'Luôn luôn',
  'Luôn tuyệt đối',
  // 'Không ý kiến',
]
export const maxLengthLevels = levelLabels.length

export const levels = Array.from({ length: maxLengthLevels }, (_, index) => ({
  label: levelLabels[index],
  value: index + 1,
}))
