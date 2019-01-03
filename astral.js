import htm from 'https://unpkg.com/htm?module'
import AstralContext from './context';
const html = htm.bind(React.createElement)
let pageContext = JSON.parse(document.getElementById('pageContext'))


const Astral = (context) => {
  return html `
    <${AstralContext.Provider} value=${context}>
      <div>hello world!</div>
    <//>
  `
}

export default Astral

ReactDOM.render(
  React.createElement(Astral, pageContext, null)
)