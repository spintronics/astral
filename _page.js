import Astral from './astral.js'
import { parseData } from './util.js'

let pageProps = parseData('pageProps') || {}

ReactDOM.render(
  React.createElement(Astral, pageProps, null),
  document.getElementById('launchpad')
)
