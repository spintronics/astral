import { getAstralContext } from './store.js'
import * as util from './util.js'

const Astral = (Page, siteContext = {}) => {
  let AstralContext = getAstralContext()
  let { routes = {} } = siteContext
  return (props = {}) => {
    if (typeof window !== 'undefined') {
      window.util = util
      React.useEffect(
        R.once(() => {
          window.performance.mark('first-render')
          window.performance.measure('first render', 'start', 'first-render')
          window.performance.measure('dom loaded', 'start', 'dom-loaded')
          window.performance.measure(
            'scripts loaded',
            'start',
            'scripts-loaded'
          )
          window.performance
            .getEntriesByType('measure')
            .forEach(measure =>
              console.log(`${measure.name} in ${measure.duration} ms`)
            )
        })
      )
    }
    return html`
      <${AstralContext.Provider} value=${siteContext}><${Page} ...${props}/><//>
    `
  }
}

export default Astral
