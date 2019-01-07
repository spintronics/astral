export let testIsServer = new Function(
  'try {return this===global;}catch(e){return false;}'
)

export let nodeBackToPromise = function(fn, context) {
  return (...args) => {
    return new Promise((res, rej) => {
      fn.apply(
        context || this,
        args.concat([
          function(err, response, body) {
            if (err) return rej(err)
            return res(body || response)
          }
        ])
      )
    })
  }
}

export let theGoodStuff = promise =>
  promise.then(x => [null, x]).catch(e => [e])

export let parseData = id => {
  let data
  try {
    data = JSON.parse(document.getElementById(id).innerHTML)
  } catch (e) {
    data = undefined
  }
  return data
}

export const flatten = (obj, delimiter = '.', skip = () => {}) => {
  // log(delimiter, skip, obj)
  const go = obj_ =>
    R.chain(([k, v]) => {
      if ((R.type(v) === 'Object' || R.type(v) === 'Array') && !skip(v)) {
        return R.map(([k_, v_]) => [`${k}${delimiter}${k_}`, v_], go(v))
      } else {
        return [[k, v]]
      }
    }, R.toPairs(obj_))

  return R.fromPairs(go(obj))
}

export let unflatten = (obj, delimiter = ' ') =>
  flat.unflatten(obj, {
    delimiter
  })

export let topLevelScope = (value, scopedOnly) => {
  let scope = testIsServer() ? global : window
  if (value) scope.universe = scope.universe || value
  if (!scope.universe) scope.universe = {}
  if (!scopedOnly) {
    scope.compat = {}
    for (let [key, value] of Object.entries(scope.universe)) {
      //if you override window.Object that's your own fault!
      scope.compat[key] = scope[key]
      scope[key] = value
    }
  }
  return scope.universe
}

export let storage = function(source) {
  let store = {
    set: function(key, val, expiration) {
      source.setItem(
        key,
        JSON.stringify({
          value: 'object' === typeof val ? JSON.stringify(val) : val,
          expirationDate:
            expiration instanceof Date ? expiration.getTime() : null
        })
      )
    },
    get: function(key) {
      let item = source.getItem(key)
      if (!item) return item
      item = JSON.parse(item)
      if (item.expirationDate && new Date() > new Date(item.expirationDate)) {
        source.removeItem(key)
        return null
      }
      return typeof item.value === 'string' &&
        (item.value[0] === '[' || item.value[0] === '{')
        ? JSON.parse(item.value)
        : item.value
    },
    remove: source.removeItem.bind(source),
    removeItem: source.removeItem.bind(source),
    clear: source.clear.bind(source)
  }
  store.getItem = store.get
  store.setItem = store.set
  return store
}
