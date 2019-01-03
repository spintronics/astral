import Koa from 'koa'
import pageTemplate from './templates/page'

const astral = new Koa()

astral.context = Object.assign(astral.context, {
  pageContext: {
    lang: 'en'
  }
})

astral.use(ctx => {
  ctx.body = pageTemplate({
    itemType: 'http://schema.org/Thing',
    lang: ctx.pageContext.lang || 'en',
    headScripts: `
      <script id="pageContext" type="text/json">
        ${JSON.stringify(ctx.pageContext)}
      </script>
      <script src="https://unpkg.com/react@16.7.0-alpha.0/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@16.7.0-alpha.0/umd/react-dom.development.js"></script>
      <script src="/astral.js" type="module"></script>
    `,
    body: `
      <main id="launchpad"></main>
    `
  })
})

astral.on('error', (err, ctx) => {
  console.error(err)
})

astral.listen(3000, port => {
  console.log(`listening to the stars on port ${port}`)
})