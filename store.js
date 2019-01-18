import { flatten, testIsServer } from './util.js'

export const getAstralContext = (context => {
  return () => {
    return context || (context = React.createContext('Galaxy'))
  }
})()

let createReducer = actions => (state, action) => actions[action](state, action)

const baseActions = {
  log: (state, action) => {
    console.log(state, action)
    return state
  }
}

let _state = {}
let _actions = baseActions

if (!testIsServer()) {
  document.addEventListener('scriptsLoaded', () => {
    if (window.session) {
      let cachedState = session.get('state')
      if ('object' === typeof cachedState) _state = cachedState
      session.set('state_old', cachedState)
      session.remove('state')
    }
    window._state = _state
  })
}

export let Store = props => {
  let { actions = {}, initialState = {}, children, includeContext } = props
  _actions = Object.assign(_actions, flatten(actions || {}))
  _state = R.mergeDeepRight(initialState, _state)
  let AstralContext = getAstralContext()

  let [state, dispatch] = React.useReducer(createReducer(_actions), _state)
  if (includeContext)
    return html`
      <${AstralContext.Consumer}>
        ${
          context => {
            return children({ state, dispatch, context })
          }
        }
      <//>
    `
  return children({ state, dispatch })
}
