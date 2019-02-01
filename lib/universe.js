import { testIsServer } from './util.js'

let scope = testIsServer() ? global : window

let universe = scope.universe

universe = {}

export const importMap = {
  R: 'https://cdn.jsdelivr.net/npm/ramda@0.26.1/dist/ramda.min.js',
  React: 'https://unpkg.com/react@16.7.0-alpha.0/umd/react.development.js',
  ReactDOM:
    'https://unpkg.com/react-dom@16.7.0-alpha.0/umd/react-dom.development.js',
  htm: 'https://unpkg.com/htm@2.0.0/dist/htm.js',
  io: 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.5/socket.io.min.js',
  rxjs: 'https://unpkg.com/rxjs/bundles/rxjs.umd.min.js'
}

export const set = (key, value) => {
  scope.universe[key] = value
  if (key in scope) scope.compat[key] = scope[key]
  scope[key] = value
}

export const get = key => scope.universe[key]

export const setUniverse = (value, scopedOnly) => {
  if (value) scope.universe = value
  if (!scope.universe) scope.universe = {}
  if (!scopedOnly) {
    scope.compat = {}
    for (let [key, value] of Object.entries(scope.universe)) {
      //if you override window.Object that's your own fault!
      scope.compat[key] = scope[key]
      scope[key] = value
    }
  }
  scope.universe.get = get
  scope.universe.set = set
  return scope.universe
}

export default universe
