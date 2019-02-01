import { flatten, testIsServer, type, log, compose } from '../lib/util.js'
import deepmerge from '../vendor/deepmerge.js'

export const getAstralContext = (context => {
  return () => {
    return context || (context = React.createContext('Galaxy'))
  }
})()

let createReducer = actions => (state, action) =>
  action && actions[action.id]
    ? actions[action.id](state, action)
    : log(state, `invalid action ${action && action.id}`)

const baseActions = {
  log: (state, action) => {
    console.log(state, action)
    return state
  },
  mutate: (state, action) => action.function(state)
}

export let Store = (() => {
  let _state = {}
  let _actions = baseActions

  if (!testIsServer()) {
    document.addEventListener('scriptsLoaded', () => {
      if (window.session) {
        let cachedState = session.get('state')
        if (type(cachedState) === 'Object') _state = cachedState
        session.set('state_old', cachedState)
        session.remove('state')
      }
      let saveState = event => {
        session.set('state', _state)
      }
      // window.onbeforeunload =
      //   type(window.onbeforeunload) === 'Function'
      //     ? compose(
      //         window.onbeforeunload,
      //         saveState
      //       )
      //     : saveState
      window.onbeforeunload = saveState
      window._state = _state
    })
  }

  let hasInitialized = (map => {
    return id => {
      if (map[id]) return true
      map[id] = 1
    }
  })({})

  return props => {
    let {
      actions = {},
      initialState = {},
      children = () => null,
      initialize = x => x,
      id
    } = props

    if (!id || !hasInitialized(id)) {
      _actions = Object.assign(_actions, flatten(actions, ' '))
      _state = deepmerge(initialState, _state)
    }

    let [state, dispatch] = React.useReducer(createReducer(_actions), _state, {
      id: 'mutate',
      function: !id || !hasInitialized(id) ? x => x : initialize
    })

    let originalDispatch = dispatch
    dispatch = (id, action) => originalDispatch(R.merge({ id }, action || {}))

    return html`
      <${React.Fragment}>${children({ state, dispatch })}<//>
    `
  }
})()

export default Store
