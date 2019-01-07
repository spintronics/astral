import fs from 'fs'
import serve from 'koa-static'
import compose from 'koa-compose'
import logger from 'koa-logger'
import R from 'ramda'
import constants from './constants'
import { nodeBackToPromise } from './util'

const fstat = nodeBackToPromise(fs.stat, fs)

// export let pageServer = async (ctx, next) => {
//   // let requestPath = (ctx.path === '/' ? '/index' : ctx.path) + '.html'
//   // if (ctx.path === '/') {
//   //   let html =
//   // }
//   if (!ctx.body) {
//     let html = _document({
//       children: reactDOMserver.renderToString(
//         new _app({
//           isServer: true
//         })
//       )
//     })
//     // ctx.set('Content-Type', 'application/vnd.myapi.v1+json');
//     ctx.status = 200
//     ctx.body = html
//     if (next) next()
//   }
//   // const fpath = path.join(__dirname, 'pages', requestPath)
//   // const [err, stat] = await theGoodStuff(fstat(fpath))

//   // if (err || !stat.isFile()) await next()
//   // else {
//   //   ctx.type = path.extname(fpath).replace('.', '')
//   //   ctx.body = fs.createReadStream(fpath)
//   // }
// }

export let limitExposure = function(predicate, mw) {
  return async function(ctx, next) {
    if (!predicate(ctx)) {
      await next()
    } else {
      await mw.call(this, ctx, next)
    }
  }
}

export let errorHandler = async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    ctx.status = err.status || 500
    ctx.body = err.message
    ctx.app.emit('error', err, ctx)
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

export default compose([
  logger(),
  // errorHandler,
  staticFiles
  // pageServer
])
