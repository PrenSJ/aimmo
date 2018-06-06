import actions from './actions'
import types from './types'
import { Observable, Scheduler } from 'rxjs'
import { map, mapTo, mergeMap, catchError, debounceTime, tap } from 'rxjs/operators'
import { ofType } from 'redux-observable'

const backgroundScheduler = Scheduler.async

const getCodeEpic = (action$, store, { api }) =>
  action$.pipe(
    ofType(types.GET_CODE_REQUEST),
    mergeMap(action =>
      api.get(`code/${store.getState().game.id}/`).pipe(
        map(response => actions.getCodeReceived(response.code)),
        catchError(error => Observable.of({
          type: types.GET_CODE_FAILURE,
          payload: error.xhr.response,
          error: true
        }))
      )
    )
  )

const postCodeEpic = (action$, store, { api }) =>
  action$
    .pipe(
      ofType(types.POST_CODE_REQUEST),
      api.post(
        `/players/api/code/${store.getState().game.id}/`,
        () => ({ code: store.getState().editor.code })
      ),
      map(response => actions.postCodeReceived()),
      catchError(error => Observable.of({
        type: types.POST_CODE_FAILURE,
        payload: error.xhr.response,
        error: true
      }))
    )

const changeCodeEpic = (action$, store, dependencies, scheduler = backgroundScheduler) =>
  action$.pipe(
    ofType(types.KEY_PRESSED),
    debounceTime(300, scheduler),
    map(action => actions.changeCode(action.payload.code))
  )

// TODO: maybe refactor all these catchErrors into individual actions instead of creating them here each time
const getConnectionParamsEpic = (action$, store, { api }) => {
  return action$.pipe(
      ofType(types.GET_CONNECTION_PARAMS_REQUEST),
      mergeMap(action => 
        api.get(`games/${store.getState().game.id}/connection_params/`).pipe(
          map(response => actions.getConnectionParamsSuccess(response)),
          catchError(error => Observable.of({
            type: types.GET_CONNECTION_PARAMS_FAIL,
            payload: error.xhr.response,
            error: true
          }))
        )
      )
    )
  }

const emitUnityEventEpic = (action$, store, { api }) => {
  return action$.pipe(
    tap(action => console.log(action)),
    ofType(types.EMIT_UNITY_EVENT),
    mergeMap(action =>
      Observable.of(action).pipe(
        api.emitUnityEvent,
        map(event => ({ type: 'SUCCESS' })),
        catchError(error => Observable.of({
            type: types.EMIT_UNITY_EVENT_FAIL,
            error: true
          })
        )
      )
    )
  )
}

export default {
  getCodeEpic,
  postCodeEpic,
  changeCodeEpic,
  getConnectionParamsEpic,
  emitUnityEventEpic
}
