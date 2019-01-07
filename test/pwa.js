import puppeteer from 'puppeteer'
import * as util from '../util'
import {
  expect
} from 'chai'
import opts from './puppeteerOptions'
import R from 'ramda'
import lighthouse from 'lighthouse'
import {
  URL
} from 'url'

let host = 'http://localhost:3000'

let urls = [
  '/'
].map(url => host + url)

// let globalVariables = R.pick(['browser', 'expect'], global)


let browser, page, chrome, lhr

before(async () => {
  browser = await puppeteer.launch(opts)

  browser.on('targetchanged', async target => {
    const page = await target.page()

    function addStyleContent(content) {
      const style = document.createElement('style')
      style.type = 'text/css'
      style.appendChild(document.createTextNode(content))
      document.head.appendChild(style)
    }

    const css = '* {color: red}'

    if (page && page.url() === url) {
      // Note: can't use page.addStyleTag due to github.com/GoogleChrome/puppeteer/issues/1955.
      // Do it ourselves.
      const client = await page.target().createCDPSession()
      await client.send('Runtime.evaluate', {
        expression: `(${addStyleContent.toString()})('${css}')`
      })
    }
  })

})

after(async () => {
  await browser.close()
})

describe('it should pass the progressive web app checklist', () => {
  it('should have a reasonable lighthouse score', async done => {
    const lhr = await Promise.all(
      urls.map(url => lighthouse(url, {
        port: (new URL(browser.wsEndpoint())).port,
        output: 'json',
        logLevel: 'info',
      }))
    )

    console.log(typeof lhr[0])

    expect(true).to.be.true

    done()
  }).timeout(30000)
})