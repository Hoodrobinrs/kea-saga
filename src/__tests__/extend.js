/* global test, expect */
import { kea, resetContext, getContext } from 'kea'
import { sagaPlugin } from '../index'
import './helper/jsdom'

test('extending sagas works', () => {
  let actionLog = []

  resetContext({ plugins: [sagaPlugin] })

  // first verify that it just works like it is

  const logic = kea({
    actions: () => ({
      increment: true,
      decrement: true,
    }),

    start: function* () {
      actionLog.push('start')
    },

    stop: function* () {
      actionLog.push('stop')
    },

    takeEvery: ({ actions }) => ({
      [actions.increment]: function* () {
        actionLog.push('takeEvery-increment')
      },
    }),

    takeLatest: ({ actions }) => ({
      [actions.decrement]: function* () {
        actionLog.push('takeLatest-decrement')
      },
    }),
  })
  const unmount1 = logic.mount()

  expect(actionLog).toEqual(['start'])

  getContext().store.dispatch(logic.actionCreators.increment())
  getContext().store.dispatch(logic.actionCreators.decrement())

  unmount1()

  expect(actionLog).toEqual(['start', 'takeEvery-increment', 'takeLatest-decrement', 'stop'])

  // reset everything
  actionLog = []
  resetContext({ plugins: [sagaPlugin] })

  // extend with more operations

  logic.extend({
    start: function* () {
      actionLog.push('extend-start')
    },

    stop: function* () {
      actionLog.push('extend-stop')
    },

    takeEvery: ({ actions }) => ({
      [actions.increment]: function* () {
        actionLog.push('extend-takeEvery-increment')
      },
    }),

    takeLatest: ({ actions }) => ({
      [actions.decrement]: function* () {
        actionLog.push('extend-takeLatest-decrement')
      },
    }),
  })

  const unmount2 = logic.mount()

  expect(actionLog).toEqual(['start', 'extend-start'])

  getContext().store.dispatch(logic.actionCreators.increment())
  getContext().store.dispatch(logic.actionCreators.decrement())

  expect(actionLog).toEqual([
    'start',
    'extend-start',
    'takeEvery-increment',
    'extend-takeEvery-increment',
    'takeLatest-decrement',
    'extend-takeLatest-decrement',
  ])

  unmount2()

  expect(actionLog).toEqual([
    'start',
    'extend-start',
    'takeEvery-increment',
    'extend-takeEvery-increment',
    'takeLatest-decrement',
    'extend-takeLatest-decrement',
    'stop',
    'extend-stop',
  ])
})
