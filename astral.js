import { parseData, topLevelScope } from './util.js'
import { Store, AstralContext } from './store.js'

const html = htm.bind(React.createElement)

let universe = topLevelScope({
  React,
  ReactDOM,
  R,
  html
})

let siteContext = parseData('siteContext') || {}

const Astral = props => {
  return html`
    <${AstralContext.Provider} value=${siteContext}>
      <${Store} initialState=${R.omit(['children'], props)}>
        ${
          ({ state, dispatch }) => {
            return html`
              <div>${JSON.stringify(state)}</div>
            `
          }
        }
      <//>
    <//>
  `
}

export default Astral
