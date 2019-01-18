import withRouter from '../wrappers/router.js'
import { compose } from '../util.js'

let index = props => {
  return html`
    <div id="page-wrapper">
      <nav>
        <a href="/about" onClick=${props.router.navigate}
          ><button name="About">About</button></a
        >
      </nav>
    </div>
  `
}

index.getInitialProps = async () => {
  return { route: '/' }
}

export default compose(withRouter({}))(index)
