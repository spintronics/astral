import Koa from 'koa'
import middleware from './middleware'
import { setUniverse } from './lib/universe'
import React from 'react'
import ReactDOM from 'react-dom'
import R from 'ramda'
import htm from 'htm'
import http2 from 'http2'
import http from 'http'
import socket from 'socket.io'
import chokidar from 'chokidar'
import constants from './constants'
import fs from 'fs'
import path from 'path'
import { log } from './lib/util'
import crypto from 'crypto'

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason)
})

const astral = new Koa()

const html = htm.bind(React.createElement)

const { PORT, HOST = 'localhost', ENVIRONMENT = 'development' } = process.env

console.log(ENVIRONMENT, PORT, HOST)

let universe = setUniverse({
  React,
  ReactDOM,
  R,
  html,
  htm
})

astral.context = Object.assign(astral.context, {
  siteContext: {
    lang: 'en',
    themeColor: '#B92304'
  },
  pageContext: {}
})

astral.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = err.message
    ctx.app.emit('error', err, ctx)
  }
})

astral.on('error', (err, ctx) => {
  console.log(err)
})

astral.use(middleware)

const server =
  ENVIRONMENT === 'prod'
    ? http2.createSecureServer(
        {
          allowHTTP1: true,
          key: fs.readFileSync(path.resolve('cert/server.key')),
          cert: fs.readFileSync(path.resolve('cert/server.crt')),
          secureOptions:
            crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_TLSv1
        },
        astral.callback()
      )
    : http.createServer(astral.callback())

server.on('error', console.error)

const io = socket(server)
let socketPool = {}

io.on('connection', socket => {
  socketPool[socket.id] = socket
  socket.emit('connected')
  socket.on('disconnect', () => {
    delete socketPool[socket.id]
  })
})

const ignoredPaths = ['node_modules']
const ignoredEvents = ['add', 'addDir']

chokidar.watch('.', { ignored: /(^|[\/\\])\../ }).on('all', (event, path) => {
  if (R.contains(event, ignoredEvents)) return
  let level1Path = path.split('/')[0]
  if (R.contains(level1Path, ignoredPaths.concat(constants.serverFiles))) return
  console.log(event, path)
  if (event === 'change') {
    for (let socket of Object.values(socketPool)) {
      io.emit('fileChange', path)
    }
  }
})

server.listen(
  PORT ||
    {
      debug: 3000,
      production: 443,
      development: 3000
    }[ENVIRONMENT],
  HOST,
  portListener
)

// this is creating a second server to redirect non https traffic
// but i think it's a little heavy handed and should be done in vanilla node
//   .createServer(astral.callback())
//   .listen((DEBUG_PORT && DEBUG_PORT + 0) || 80, HOST, portListener)

function portListener() {
  const { address, port } = this.address()
  const protocol = this.addContext ? 'https' : 'http'
  console.log(`Listening to the stars on ${protocol}://${address}:${port}...`)
}
