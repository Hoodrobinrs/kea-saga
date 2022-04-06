/* global test, expect, beforeEach */
import { kea, resetContext, getContext } from 'kea'
import { sagaPlugin } from '../index'
import './helper/jsdom'
import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import { put } from 'redux-saga/effects'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

beforeEach(() => {
  resetContext({ plugins: [sagaPlugin] })
})

function SampleComponent() {
  return <div>bla bla ble</div>
}

test('the saga starts and stops with the component', () => {
  const { store } = getContext()

  let sagaStarted = false

  const logicWithSaga = kea({
    *start() {
      expect(this.props.id).toBe(12)
      sagaStarted = true
    },
  })

  expect(sagaStarted).toBe(false)

  const ConnectedComponent = logicWithSaga(SampleComponent)

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent id={12} />
    </Provider>,
  )

  expect(sagaStarted).toBe(true)
  wrapper.unmount()
})

test('the actions get a key', () => {
  const { store } = getContext()

  let sagaStarted = false
  let takeEveryRan = false

  const getActionsFromHere = kea({
    actions: () => ({
      something: true,
    }),
  })

  const logicWithSaga = kea({
    connect: {
      actions: [getActionsFromHere, ['something']],
    },

    key: (props) => props.id,

    path: (key) => ['scenes', 'sagaProps', key],

    actions: () => ({
      myAction: (value) => ({ value }),
    }),

    reducers: ({ actions }) => ({
      someData: [
        'nothing',
        PropTypes.string,
        {
          [actions.myAction]: (state, payload) => payload.value,
        },
      ],
    }),

    *start() {
      expect(this.key).toBe(12)
      expect(this.props.id).toBe(12)
      expect(this.path).toEqual(['scenes', 'sagaProps', 12])
      expect(Object.keys(this.actionCreators)).toEqual(['something', 'myAction'])

      const { myAction } = this.actionCreators
      expect(myAction('something')).toEqual({ type: myAction.toString(), payload: { value: 'something' } })
      expect(myAction.toString()).toContain('sagaProps.12')

      expect(yield this.get('someData')).toEqual('nothing')
      yield put(myAction('something'))

      expect(yield this.get('someData')).toEqual('something')

      sagaStarted = true
    },

    takeEvery: ({ actions, workers }) => ({
      [actions.myAction]: workers.doStuff,
    }),

    workers: {
      *doStuff(action) {
        const { value } = action.payload
        expect(value).toBe('something')

        // should already be in the store
        expect(yield this.get('someData')).toBe('something')

        takeEveryRan = true
      },
    },
  })

  expect(sagaStarted).toBe(false)

  const ConnectedComponent = logicWithSaga(SampleComponent)

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent id={12} />
    </Provider>,
  )

  expect(sagaStarted).toBe(true)
  expect(takeEveryRan).toBe(true)

  wrapper.unmount()
})
