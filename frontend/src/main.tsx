/**
 * @file App entry

 */

import React from 'react'
import ReactDOM from 'react-dom'
import 'antd/dist/reset.css'

import './styles/styles.less'
// runtime for speech recognition features
import 'regenerator-runtime'

import { App } from './App'

ReactDOM.render(<App />, document.getElementById('root'))
