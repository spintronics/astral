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

export let promiseProp = (value, promise) => {
  if (!value && promise && promise.then) {
    promise.then(function(res) {
      value = res
      return res
    })
  }
  return function() {
    if (value) return Promise.resolve(value)
    else {
      if (!promise) return Promise.reject(null)
      if (promise.then) return promise
      promise = promise().then(function(res) {
        value = res
        return res
      })
      return promise
    }
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

export const registerScriptsLoadedEvent = requiredKeys => {
  if (testIsServer() || !(requiredKeys instanceof Array)) return
  let scriptsLoadedEvent = new Event('scriptsLoaded')
  let addEventListener = document.addEventListener
  let scriptsLoaded = false
  let runFirstList = []

  document.addEventListener = function(...args) {
    if (args[0] === 'scriptsLoaded' && scriptsLoaded) args[1]()
    return addEventListener.apply(this, args)
  }

  let runFirst = fn => {
    if (scriptsLoaded) {
      if (fn) fn()
      runFirstList.forEach(fn => fn())
    } else runFirstList.push(fn)
  }

  let scriptsLoadedInterval = setInterval(() => {
    requiredKeys = requiredKeys.filter(key => !(key in window))
    if (!requiredKeys.length) {
      clearInterval(scriptsLoadedInterval)
      scriptsLoaded = true
      runFirst()
      document.dispatchEvent(scriptsLoadedEvent)
    }
  }, 10)

  return runFirst
}

export const curry = function(fn) {
  return (...args) => {
    if (args.length >= fn.length) return fn(...args)
    if (!args.length) return fn
    return curry(fn.bind(null, args))
  }
}

export const flatten = (obj, delimiter = '.', skip = () => {}) => {
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

// let combineArrayOrDeepMerge = (fn => {
//   return () => {
//     return (
//       fn ||
//       (fn = R.ifElse(
//         R.compose(
//           R.equals('Array'),
//           R.type
//         ),
//         (a, b) =>
//           (b instanceof Array
//             ? b
//             : R.reduce(
//                 (acc, [x, y]) => R.set(R.nth(x), y, acc),
//                 [],
//                 R.toPairs(b)
//               )
//           ).map((y, x) => a[x] || y),
//         R.mergeDeepRight
//       ))
//     )
//   }
// })()

// export const unflatten = (delimiter = '.', skip = () => {}) =>
//   R.compose(
//     R.reduce((result, [k, v]) => {
//       return R.compose(
//         R.mergeDeepWith(combineArrayOrDeepMerge(), result),
//         R.addIndex(R.reduce)((piece, key, dex, keys) => {
//           let isArray = !isNaN(key)
//           let parent = keys.slice(0, dex)
//           let path = parent.concat([isArray ? parseInt(key) : key])
//           if (isArray)
//             piece = R.set(R.lensPath(parent), Array(v).fill(null), piece)
//           return R[skip(path.join(delimiter)) ? 'reduced' : 'identity'](
//             R.set(R.lensPath(path), dex === keys.length - 1 ? v : {}, piece)
//           )
//         }, {}),
//         R.split(delimiter)
//       )(k)
//     }, {}),
//     R.toPairs
//   )

export let unflatten = function(target, opts) {
  opts = opts || {}

  var delimiter = opts.delimiter || '.'
  var overwrite = opts.overwrite || false
  var result = {}

  if (Object.prototype.toString.call(target) !== '[object Object]') {
    return target
  }

  // safely ensure that the key is
  // an integer.
  function getkey(key) {
    var parsedKey = Number(key)

    return isNaN(parsedKey) || key.indexOf('.') !== -1 || opts.object
      ? key
      : parsedKey
  }

  var sortedKeys = Object.keys(target).sort(function(keyA, keyB) {
    return keyA.length - keyB.length
  })

  sortedKeys.forEach(function(key) {
    var split = key.split(delimiter)
    var key1 = getkey(split.shift())
    var key2 = getkey(split[0])
    var recipient = result

    while (key2 !== undefined) {
      var type = Object.prototype.toString.call(recipient[key1])
      var isobject = type === '[object Object]' || type === '[object Array]'

      // do not write over falsey, non-undefined values if overwrite is false
      if (!overwrite && !isobject && typeof recipient[key1] !== 'undefined') {
        return
      }

      if ((overwrite && !isobject) || (!overwrite && recipient[key1] == null)) {
        recipient[key1] = typeof key2 === 'number' && !opts.object ? [] : {}
      }

      recipient = recipient[key1]
      if (split.length > 0) {
        key1 = getkey(split.shift())
        key2 = getkey(split[0])
      }
    }

    // unflatten again for 'messy objects'
    recipient[key1] = unflatten(target[key], opts)
  })

  return result
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

export let compose = (...fns) => {
  return v => fns.reduceRight((x, f) => f(x), v)
}

export let log = function(...args) {
  args.forEach(arg => {
    if (('string' === typeof arg && arg[0] === '{') || arg[0] === '[') {
      console.log(JSON.parse(arg, null, 2))
    } else console.log(arg)
  })
  return args[0]
}

export let prop = _val => {
  let fn = val => (val ? (_val = val) : _val)
  fn.isProp = true
  fn.extend = R.mergeDeepRight(_val)
  return fn
}
