// custom.d.ts
import React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      marquee: any
    }
  }
}
