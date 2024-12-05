export const scrollToErrorField = (targetClass: string) => {
  const errElm = document.querySelector(targetClass)
  if (errElm) {
    errElm.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }
}
