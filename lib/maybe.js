import util from './util.js'

export let Just = x => {
  let _val = x
  let just = {
    map: f => Just(f(_val)),
    chain: f => f(_val),
    reduce: (f, x) => f(x, _val),
    ap: m => m.map(_val)
  }
  just.isJust = true
  just.toString = `Just(${_val})`
  return just
}

export let Nothing = () => {
  let nil = () => null
  let nothing = {
    map: nil,
    chain: nil,
    ap: nil,
    reduce: nil,
    filter: nil
  }
  nothing.isNothing = true
  nothing.toString = `Nothing()`
  return nothing
}

export let Maybe = util.curry((type, val) =>
  (!type && val !== null) || util.type(val) === type ? Just(val) : Nothing()
)

export default Maybe
