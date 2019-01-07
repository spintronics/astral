export default function html(template, ...args) {
  let parsed = ''
  for (let dex of template.keys()) {
    parsed += template[dex]
    parsed += typeof args[dex] === 'undefined' ? '' : args[dex]
  }
  return parsed
}