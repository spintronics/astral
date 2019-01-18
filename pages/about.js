import { compose } from '../util.js'

let about = props => {
  return html`
    <div id="page-wrapper">
      <nav>
        <a href="/" ...${{ accessKey: 'h' }}
          ><button name="Home">HOME</button></a
        >
      </nav>
    </div>
  `
}

export default compose(withRouter({}))(about)
