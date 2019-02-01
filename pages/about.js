import { compose } from '../lib/util.js'
import { withRouter } from '../wrappers/router.js'

let about = props => {
  return html`
    <div id="page-wrapper">
      about
      <nav>
        <a href="/" ...${{ accessKey: 'h' }}
          ><button name="Home">HOME</button></a
        >
      </nav>
    </div>
  `
}
export default compose(withRouter({}))(about)
