export default config => `
  <!doctype html>
  <html itemtype=${config.itemType} lang=${config.lang || 'en'}>
    <head>
      <title>${config.title || 'Midas'}</title>
      ${config.styles}
      ${config.headScripts}
    </head>
    <body>
      ${config.body}
    </body>
  </html>
`