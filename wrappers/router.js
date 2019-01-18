import { testIsServer } from '../util.js'
import deepmerge from '../vendor/deepmerge.js'

export let routeMap = {}
if ('undefined' !== typeof window) window.routeMap = routeMap

/**
 *
 * merge page routes with top level routes
 * pages may extend their own routes
 * components may extend the page routes
 *
 */

let extend = routes => (routeMap = deepmerge(routeMap, routes))
export let withRouter = routes => {
  extend(routes)
  return WrappedComponent => {
    return props => {
      let navigate = function(event) {
        event.preventDefault()
        let target = event.currentTarget
        let path = target.pathname.split('/')
        let route = R.pathOr(null, path, routeMap)
        if (!route) {
          target.style.color = 'red'
        }
        //replace url and change page blah blah
      }
      let navigateTo = path => {
        return navigate.bind({
          href: path
        })
      }
      let Link = props =>
        html`
          <a onClick=${navigate} ...${props}></a>
        `
      return html`
        <${WrappedComponent}
          router=${{ routeMap, extend, navigate, navigateTo, Link }}
          ...${props}
        />
      `
    }
  }
}

export default withRouter
