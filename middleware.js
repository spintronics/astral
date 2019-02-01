import fs from 'fs'
import serve from 'koa-static'
import * as koaCompose from 'koa-compose'
import logger from 'koa-logger'
import compress from 'koa-compress'
import R from 'ramda'
import constants from './constants'
import reactDOMserver from 'react-dom/server'
import { theGoodStuff, compose } from './lib/util'
import { promisify } from 'util'
import { importMap } from './lib/universe'
import { withRouter } from './wrappers/router.js'
import path from 'path'

let log = R.tap(console.log)
let postLoadMap = {
  Astral: './astral.js',
  _document: './pages/_document.js',
  _404: './pages/_404.js'
}
let postLoad

const resolveImportMap = map => {
  return Promise.all(
    Object.values(map).map(path =>
      import(path).catch(err => {
        log(err)
        return { default: x => x }
      })
    )
  ).then(importedResources => {
    let keys = Object.keys(map)
    return importedResources.reduce((acc, resource, dex) => {
      acc[keys[dex]] = resource.default
      return acc
    }, {})
  })
}

// export let httpRedirect = (ctx, next) => {
//   if (!ctx.request.secure) {
//     return ctx.redirect(
//       'https://' +
//         R.pathOr(process.env.DOMAIN, ['request', 'headers', 'host'], ctx) +
//         ctx.request.url
//     )
//   } else return next()
// }

export let contextProvider = async (ctx, next) => {
  //if not pageRoutes add to siteContext by reading filenames
  if (!ctx.siteContext) ctx.siteContext = {}
  if (!ctx.siteContext.pageDir) {
    let pageDir = await promisify(fs.readdir)(path.resolve('./pages'))
    ctx.siteContext.pageDir = pageDir.filter(pageName => pageName[0] !== '_')
    //update this to support nested routes
    ctx.siteContext.pageRoutes = R.reduce(
      (a, page) =>
        R.set(
          R.lensProp(R.head(page.split('.')).replace(/\W/g, '')),
          `/${page.split('.').shift()}`,
          a
        ),
      {},
      ctx.siteContext.pageDir
    )
  }
  ctx.pageContext = Object.assign(
    {
      lang: ctx.siteContext.lang
    },
    ctx.pageContext || {}
  )
  await next()
}

export let pageServer = async (ctx, next) => {
  if (!postLoad) {
    postLoad = await resolveImportMap(postLoadMap)
  }

  let requestPath = `./pages${ctx.path === '/' ? '/index' : ctx.path}.js`

  if (next) await next()

  if (!ctx.body) {
    let [err, page] = await theGoodStuff(import(requestPath))
    page = !err && page && page.default

    log(err, page)

    let initialProps = page.getInitialProps
      ? await page.getInitialProps(ctx.pageContext)
      : {}

    ctx.status = page ? 200 : 404

    let { pageRoutes = {} } = ctx.siteContext

    let renderedPage = page
      ? reactDOMserver.renderToString(
          compose(withRouter(pageRoutes))(
            postLoad.Astral(page, ctx.siteContext)
          )(initialProps)
        )
      : postLoad._404(ctx)

    console.log(renderedPage)

    let loadFirst = {
      React: 1
    }

    ctx.body = postLoad._document({
      context: ctx,
      itemType: 'http://schema.org/Thing',
      lang: ctx.pageContext.lang || 'en',
      themeColor: ctx.siteContext.themeColor,
      title: 'Astral',
      description: ctx.pageContext.description || 'in a space out of time',
      url: `https://${ctx.request.host}${ctx.path}`,
      headScripts: Object.entries(importMap).reduce(
        (str, [key, browserImport]) => {
          return (
            str +
            `<script src="${browserImport}" ${
              key in loadFirst ? '' : 'async defer'
            }></script>`
          )
        },
        ''
      ),
      initialize: `
        <script type="module">
          ${page ? `import page from '${requestPath}'` : ''}
          import Astral from './astral.js'
          import universe from './lib/universe.js'
          import {compose, prop} from './lib/util.js'
          import {withRouter} from './wrappers/router.js'

          let siteContext = window.siteContext = ${JSON.stringify(
            ctx.siteContext
          )}
          let pageContext = ${JSON.stringify(ctx.pageContext)}

          let initialProps = ${JSON.stringify(initialProps)}

          let {pageRoutes = {}} = siteContext
          
          document.addEventListener('scriptsLoaded', async () => {
            ${
              page
                ? `ReactDOM.hydrate(
                    React.createElement(
                      compose(
                        withRouter(pageRoutes)
                      )(Astral(
                        page,
                        siteContext
                      )),
                      initialProps
                    ),
                    document.getElementById('launchpad')
                  )`
                : ''
            }
          })
        </script>
      `,
      body: renderedPage
    })
    // ctx.set('Content-Type', 'application/vnd.myapi.v1+json');
  }
}

export let limitExposure = function(predicate, mw) {
  return async function(ctx, next) {
    if (!predicate(ctx)) {
      await next()
    } else {
      await mw.call(this, ctx, next)
    }
  }
}

export let staticFiles = limitExposure(
  R.compose(
    R.unnest,
    R.not,
    R.contains(R.__, constants.serverFiles),
    R.nth(1),
    R.split('/'),
    R.prop('path')
  ),
  serve('.')
)

export default koaCompose.default([
  contextProvider,
  // httpRedirect,
  logger(),
  // compress({
  //   filter: function(content_type) {
  //     return /text|javascript/i.test(content_type)
  //   },
  //   threshold: 2048,
  //   flush: require('zlib').Z_SYNC_FLUSH
  // }),
  staticFiles,
  pageServer
])
