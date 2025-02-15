import { call, take, cancel, fork } from 'redux-saga/effects'
import { EventChannel, eventChannel, Saga, TakeableChannel, Task } from 'redux-saga'

let emitter: (input: any) => void
let forkedSagas: Record<string, Task> = {}

function createComponentChannel(): EventChannel<any> {
  return eventChannel((emit) => {
    emitter = emit
    return () => {}
  })
}

export function* keaSaga(): any {
  const channel: TakeableChannel<any> = yield call(createComponentChannel)
  while (true) {
    const { task, saga, index } = yield take(channel)
    if (task === 'startSaga') {
      forkedSagas[index] = yield fork(saga)
    }
    if (task === 'cancelSaga') {
      yield cancel(forkedSagas[index])
    }
  }
}

export function startSaga(index: number, saga: Saga): boolean {
  if (!emitter) {
    return false
  }
  emitter({ task: 'startSaga', saga, index })
  return true
}

export function cancelSaga(index: number): boolean {
  if (!emitter) {
    return false
  }
  emitter({ task: 'cancelSaga', index })
  return true
}
