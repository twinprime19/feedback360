import { useEffect, useState } from 'react'

export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState({
    isMobile: false,
    isTablet: false,
    isLargeTablet: false,
    isSmallDesktop: false,
    isDesktop: false,
    isLargeDesktop: false,
  })

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth
      if (width < 576) {
        // Mobile devices (xs)
        setDeviceType({
          isMobile: true,
          isTablet: false,
          isLargeTablet: false,
          isSmallDesktop: false,
          isDesktop: false,
          isLargeDesktop: false,
        })
      } else if (width >= 576 && width < 768) {
        // Tablet devices (sm)
        setDeviceType({
          isMobile: false,
          isTablet: true,
          isLargeTablet: false,
          isSmallDesktop: false,
          isDesktop: false,
          isLargeDesktop: false,
        })
      } else if (width >= 768 && width < 992) {
        // Large tablet devices (md)
        setDeviceType({
          isMobile: false,
          isTablet: false,
          isLargeTablet: true,
          isSmallDesktop: false,
          isDesktop: false,
          isLargeDesktop: false,
        })
      } else if (width >= 992 && width < 1200) {
        // Small desktop devices (lg)
        setDeviceType({
          isMobile: false,
          isTablet: false,
          isLargeTablet: false,
          isSmallDesktop: true,
          isDesktop: false,
          isLargeDesktop: false,
        })
      } else if (width >= 1200 && width < 1600) {
        // Large desktop devices (xl)
        setDeviceType({
          isMobile: false,
          isTablet: false,
          isLargeTablet: false,
          isSmallDesktop: false,
          isDesktop: true,
          isLargeDesktop: false,
        })
      } else {
        // Very large desktop devices (xxl)
        setDeviceType({
          isMobile: false,
          isTablet: false,
          isLargeTablet: false,
          isSmallDesktop: false,
          isDesktop: true,
          isLargeDesktop: true,
        })
      }
    }

    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => {
      window.removeEventListener('resize', updateDeviceType)
    }
  }, [])

  return deviceType
}
