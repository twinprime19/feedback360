import { Col, Radio, Row, Typography } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import * as Icon from '@ant-design/icons'

import { levels, maxLengthLevels } from '@/constants/level'
import { APP_LAYOUT_GUTTER_SIZE, TABLE_HEADER_COLOR } from '@/config'
import '../style.less'
import { useDeviceType } from '@/hooks/useDeviceType'
import { defaultPoint } from '../slice'

const { Group, Button } = Radio

interface LevelsTableProps {
  showLabel: boolean
  handleChange: (e: number) => void
  value: number
}

const LevelsTable = (props: LevelsTableProps) => {
  const { showLabel, handleChange, value } = props
  const { isMobile, isTablet, isLargeTablet, isSmallDesktop, isDesktop, isLargeDesktop } =
    useDeviceType()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [showCheckIcon, setShowCheckIcon] = useState(false)

  useEffect(() => {
    if (value !== defaultPoint && audioRef.current) {
      audioRef.current.play()
    }

    setShowCheckIcon(true)
    const timer = setTimeout(() => {
      setShowCheckIcon(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [value])

  return (
    <Group
      style={{
        width: '100%',
        marginTop: 2,
      }}
      onChange={(e) => handleChange(e.target.value)}
      value={value}
    >
      {/* Sound effect */}
      <audio ref={audioRef}>
        <source src="/audios/Tock.wav" type="audio/mpeg" />
      </audio>

      <Row gutter={[0, APP_LAYOUT_GUTTER_SIZE / 2]}>
        {levels.map((item, itemIndex) => (
          <Col
            // xs={12}
            // sm={8}
            // md={6}
            // lg={4}
            // xl={4}
            // xxl={4}
            key={item.value}
            style={{
              display: 'flex',
              width: isMobile ? '50%' : isTablet ? '33.3333333%' : isLargeTablet ? '25%' : '20%',
            }}
          >
            <div
              style={{
                flex: 1,
                borderLeft: `1px solid ${TABLE_HEADER_COLOR}`,
                borderRight: `${
                  (isMobile && (itemIndex + 1) % 2 === 0) ||
                  itemIndex === levels.length - 1 ||
                  (isTablet && ((itemIndex + 1) % 3 === 0 || itemIndex === levels.length - 1)) ||
                  (isLargeTablet &&
                    ((itemIndex + 1) % 4 === 0 || itemIndex === levels.length - 1)) ||
                  ((isSmallDesktop || isDesktop || isLargeDesktop) &&
                    itemIndex === levels.length - 1)
                    ? '1px'
                    : 0
                } solid ${TABLE_HEADER_COLOR}`,
              }}
            >
              <div
                style={{
                  backgroundColor: TABLE_HEADER_COLOR,
                  padding: 4,
                  borderBottom: `1px solid ${TABLE_HEADER_COLOR}`,
                  borderTop: `1px solid ${TABLE_HEADER_COLOR}`,
                  height: 36,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <Typography.Text
                  strong
                  style={{
                    color: 'white',
                  }}
                  ellipsis
                >
                  {/* {showLabel
                    ? `${item.value < maxLengthLevels ? `${item.value}= ` : ''} ${item.label}`
                    : item.value < maxLengthLevels
                    ? item.value
                    : item.label} */}
                  {
                    showLabel ? item.label : item.value
                    // < maxLengthLevels
                    // ? item.value
                    // : item.label
                  }
                </Typography.Text>
              </div>
              <div
                style={{
                  height: 36,
                  borderBottom: `1px solid ${TABLE_HEADER_COLOR}`,
                }}
                className="customLevelsCheck"
              >
                <Button
                  value={item.value}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 0,
                    margin: 0,
                    textAlign: 'center',
                    color: TABLE_HEADER_COLOR,
                  }}
                >
                  {item.value === value ? (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: TABLE_HEADER_COLOR,
                      }}
                    >
                      <Icon.CheckOutlined
                        style={{
                          fontSize: 20,
                          transform: showCheckIcon ? 'scale(0)' : 'scale(1)',
                          transition: 'transform 0.05s ease',
                        }}
                      />
                    </div>
                  ) : (
                    ''
                  )}
                </Button>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Group>
  )
}

export default LevelsTable
