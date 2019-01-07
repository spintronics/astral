import html from './template'
export default config => html`
  <!DOCTYPE html>
  <html
    itemtype="${config.itemType || 'http://schema.org/Thing'}"
    lang="${config.lang || 'en'}"
  >
    <head>
      <title>${config.title}</title>
      ${config.styles} ${config.headScripts}
      <script type="module">
        import { storage } from './util.js'
        let session = storage(window.sessionStorage)
        window.session = session
        let saveAndReload = () => {
          //try to do hmr instead of reloading
          session.set('state', window._state)
          window.location.reload()
        }
        document.addEventListener('DOMContentLoaded', event => {
          let socket = (window.socket = io())
          let connected
          let onevent = socket.onevent
          socket.onevent = function(...args) {
            let packet = args[0]
            let data = (packet && packet.data) || []
            let event = {
              type: data[0],
              data: data.slice(1)
            }
            console.log('socketEvent', event)
            if (event.type === 'fileChange') saveAndReload()
            return onevent.apply(socket, args)
          }
          socket.on('connected', () => {
            if (connected) saveAndReload()
            connected = true
          })
        })
      </script>
    </head>
    <body>
      ${config.body}
    </body>
  </html>
`
