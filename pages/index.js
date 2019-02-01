import withRouter from '../wrappers/router.js'
import { compose } from '../lib/util.js'
import { Store } from '../wrappers/store.js'

let index = props => {
  return html`
    <div id="page-wrapper">
      index
      <nav>
        <button name="About" onClick=${props.router.navigateTo('/about')}>
          About
        </button>
        <a href="/about" title="About" onClick=${props.router.navigate}
          >about</a
        >
      </nav>
    </div>
  `
}

index.getInitialProps = async () => {
  return { route: '/' }
}

// export default index
export default compose(withRouter({}))(index)
