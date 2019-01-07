import Koa from 'koa'
import pageTemplate from './templates/page'
import middleware from './middleware'
import { topLevelScope } from './util'
import React from 'react'
import ReactDOM from 'react-dom'
import R from 'ramda'
import htm from 'htm'
import http from 'http'
import socket from 'socket.io'
import chokidar from 'chokidar'
import constants from './constants'

const astral = new Koa()

const html = htm.bind(React.createElement)

let universe = topLevelScope({
  React,
  ReactDOM,
  R,
  html
})

astral.context = Object.assign(astral.context, {
  pageContext: {
    lang: 'en'
  }
})

astral.use(middleware)

astral.use(ctx => {
  console.log(ctx.path)
  if (ctx.path === '/') {
    ctx.body = pageTemplate({
      itemType: 'http://schema.org/Thing',
      lang: ctx.pageContext.lang || 'en',
      title: 'Astral',
      headScripts: `
        <script id="pageContext" type="text/json">
          ${JSON.stringify(ctx.pageContext)}
        </script>
        <script src="https://unpkg.com/react@16.7.0-alpha.0/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@16.7.0-alpha.0/umd/react-dom.development.js"></script>
        <script src="//cdn.jsdelivr.net/npm/ramda@0.25/dist/ramda.min.js"></script>
        <script src="https://unpkg.com/htm@2.0.0/dist/htm.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.5/socket.io.min.js"></script>
        <script src="/_page.js" type="module"></script>
      `,
      body: `
        <main id="launchpad"></main>
      `
    })
  }
})

// astral.on('error', (err, ctx) => {
//   console.error(err)
// })

const server = http.createServer(astral.callback())

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

console.log(process.argv, process.execArgv)

chokidar.watch('.', { ignored: /(^|[\/\\])\../ }).on('all', (event, path) => {
  if (R.contains(event, ignoredEvents)) return
  let level1Path = path.split('/')[0]
  if (R.contains(level1Path, ignoredPaths)) return
  if (R.contains(level1Path, constants.serverFiles)) return
  console.log(event, path)
  if (event === 'change') {
    for (let socket of Object.values(socketPool)) {
      io.emit('fileChange', path)
    }
  }
})

server.listen(3000, () => {
  console.log(`listening to the stars`)
})
