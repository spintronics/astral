import { testIsServer, type } from '../lib/util.js'
import deepmerge from '../vendor/deepmerge.js'
import Store from './store.js'

export let routeMap = {}
if ('undefined' !== typeof window) window.routeMap = routeMap
let isServer = testIsServer()

/**
 *
 * merge page routes with top level routes
 * pages may extend their own routes
 * components may extend the page routes
 *
 */

let extend = routes => (routeMap = deepmerge(routeMap, routes))

export let initialState = {
  router: {
    currentPath: '',
    history: []
  }
}

export let actions = {
  router: {
    push: (state, action) => {
      setTimeout(
        window.history.pushState.bind(
          window.history,
          action.state,
          action.title,
          action.url
        ),
        0
      )
      return R.evolve(
        {
          router: {
            currentPath: () => action.url,
            history: R.flip(R.concat)([action.url])
          }
        },
        state
      )
    }
  }
}

export let withRouter = routes => {
  extend(routes)
  return WrappedComponent => {
    let router = dispatch => {
      let navigate = function(event) {
        event.preventDefault()
        let target = event.currentTarget
        let { state = {}, pathname = '/', title = '' } = target
        let url = R.pathOr(null, pathname.split('/').filter(Boolean), routeMap)
        if (!url) {
          target.style.color = 'red'
        }
        dispatch('router push', {
          state,
          title,
          url
        })
      }
      let navigateTo = path => {
        return navigate.bind({
          path
        })
      }
      let Link = props =>
        html`
          <a onClick=${navigate} ...${props}></a>
        `
      return {
        Link,
        navigate,
        navigateTo,
        routeMap
      }
    }

    let initialize = initialPath =>
      R.compose(
        R.evolve({
          currentPath: () => initialPath,
          router: {
            history: R.compose(
              R.takeLast(50),
              R.ifElse(
                R.compose(
                  R.not,
                  R.equals(initialPath),
                  R.tail
                ),
                R.flip(R.concat)([initialPath]),
                R.identity
              )
            )
          }
        }),
        state => {
          if (!isServer) {
            let fetchPage = event => {
              debugger
            }
            // window.onbeforeunload =
            //   type(window.onbeforeunload) === 'Function'
            //     ? R.compose(
            //         fetchPage,
            //         window.onbeforeunload
            //       )
            //     : fetchPage
            window.onpopstate = fetchPage
          }
          return state
        }
      )

    return props => {
      return html`
        <${Store}
          initialState=${initialState}
          actions=${actions}
          initialize=${isServer ? x => x : initialize(window.location.pathname)}
          id="withRouter"
        >
          ${
            ({ dispatch }) => {
              return html`
                <${WrappedComponent} router=${router(dispatch)} ...${props} />
              `
            }
          }
        <//>
      `
    }
  }
}

export default withRouter
