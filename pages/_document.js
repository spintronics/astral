import html from './template'
export default config => html`
  <!DOCTYPE html>
  <html
    itemtype="${config.itemType || 'http://schema.org/Thing'}"
    lang="${config.lang || 'en'}"
  >
    <head>
      <title>${config.title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="Description" content="${config.description}" />
      <meta name="theme-color" content="${config.themeColor}" />
      <link rel="manifest" href="/manifest.json" as="manifest" />
      <link
        rel="icon"
        type="image/png"
        sizes="512x512"
        href="/icons/sun_transparent-512.png"
        as="icon"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/icons/sun_transparent-192.png"
        as="icon"
      />
      <link rel="canonical" href="${config.url}" />
      <script>
        window.performance.mark('start')
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/butler.js')
          })
        }
      </script>
      ${config.styles}
      <script type="module" id="bootstrap">
        import { storage, registerScriptsLoadedEvent } from './lib/util.js'
        import { importMap, setUniverse } from './lib/universe.js'

        let session = storage(window.sessionStorage)

        let importKeys = Object.keys(importMap)

        let universe

        let saveAndReload = () => {
          let oldState = session.get('state')
          if (oldState) session.set('state_old', oldState)
          session.set('state', window._state)
          window.location.reload()
        }

        registerScriptsLoadedEvent(importKeys)(() => {
          window.performance.mark('scripts-loaded')
          universe = setUniverse(
            Object.assign(
              importKeys.reduce(
                (acc, key) => Object.assign(acc, { [key]: window[key] }),
                {}
              ),
              {
                session
              }
            )
          )

          universe.set('html', htm.bind(React.createElement))
          universe.set(
            'pageContext',
            ${JSON.stringify(config.context.pageContext)}
          )
          universe.set(
            'siteContext',
            ${JSON.stringify(config.context.siteContext)}
          )

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
            //console.log('socketEvent', event)
            if (event.type === 'fileChange') {
              //try to do hmr instead of reloading
              return saveAndReload()
            }
            return onevent.apply(socket, args)
          }
          socket.on('connected', () => {
            if (connected) saveAndReload()
            connected = true
          })
        })

        window.addEventListener('beforeinstallprompt', e => {
          e.prompt()
          e.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt')
            } else {
              console.log('User dismissed the A2HS prompt')
            }
          })
        })

        document.addEventListener('DOMContentLoaded', event => {
          window.performance.mark('dom-loaded')
        })
      </script>
      ${config.headScripts} ${config.initialize}
    </head>

    <body>
      <main id="launchpad">${config.body}</main>
    </body>
  </html>
`
