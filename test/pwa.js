import puppeteer from 'puppeteer'
import { log, flatten } from '../util'
import assert from 'assert'
import opts from './puppeteerOptions'
import R from 'ramda'
import lighthouse from 'lighthouse'
import { URL } from 'url'
import fs from 'fs'
import { promisify } from 'util'
import constant from './constants'
import { setUniverse } from '../universe'

setUniverse({
  R
})

let urls = ['/'].map(url => constant.host + url)

let browser, page, chrome, lhr

before(async () => {
  browser = await puppeteer.launch(opts)

  // browser.on('targetchanged', async target => {
  //   const page = await target.page()

  //   function addStyleContent(content) {
  //     const style = document.createElement('style')
  //     style.type = 'text/css'
  //     style.appendChild(document.createTextNode(content))
  //     document.head.appendChild(style)
  //   }

  //   const css = '* {color: red}'

  //   if (page && page.url() === url) {
  //     // Note: can't use page.addStyleTag due to github.com/GoogleChrome/puppeteer/issues/1955.
  //     // Do it ourselves.
  //     const client = await page.target().createCDPSession()
  //     await client.send('Runtime.evaluate', {
  //       expression: `(${addStyleContent.toString()})('${css}')`
  //     })
  //   }
  // })
})

after(() => {
  return browser.close()
})

describe('it should pass the progressive web app checklist', () => {
  it('passes audits', () => {
    return Promise.all(
      urls.map(url =>
        lighthouse(url, {
          port: new URL(browser.wsEndpoint()).port,
          output: 'json',
          logLevel: 'error'
        })
      )
    ).then(results => {
      let mappedResults = results.reduce(
        (acc, result, dex) => Object.assign(acc, { [urls[dex]]: result.lhr }),
        {}
      )

      let missedRequirements = {}
      let skippedRequirements = [
        'critical-request-chains',
        'screenshot-thumbnails',
        'final-screenshot',
        'network-requests',
        'metrics',
        'pwa-cross-browser',
        'user-timings',
        'themed-omnibox',
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-valid-attr-value',
        'aria-valid-attr',
        'audio-caption',
        'definition-list',
        'dlitem',
        'frame-title',
        'user-timings',
        'themed-omnibox',
        'pwa-page-transitions',
        'pwa-each-page-has-url',
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-valid-attr-value',
        'aria-valid-attr',
        'audio-caption',
        'button-name',
        'definition-list',
        'dlitem',
        'frame-title',
        'image-alt',
        'input-image-alt',
        'label',
        'layout-table',
        'list',
        'listitem',
        'meta-refresh',
        'object-alt',
        'tabindex',
        'td-headers-attr',
        'th-has-data-cells',
        'valid-lang',
        'video-caption',
        'video-description',
        'custom-controls-labels',
        'custom-controls-roles',
        'focus-traps',
        'focusable-controls',
        'heading-levels',
        'interactive-element-affordance',
        'logical-tab-order',
        'managed-focus',
        'offscreen-content-hidden',
        'use-landmarks',
        'visual-order-follows-dom',
        'uses-http2',
        'meta-description',
        'robots-txt',
        'canonical',
        'mobile-friendly',
        'structured-data'
      ].reduce((a, x) => R.merge(a, { [x]: 1 }), {})

      for (let [url, result] of Object.entries(mappedResults)) {
        let missedRequirementsByUrl = Object.values(result.audits).reduce(
          (missed, audit) =>
            audit.score || audit.id in skippedRequirements
              ? missed
              : Object.assign(missed, {
                  [audit.id]: R.pick(['description', 'id'], audit)
                }),
          {}
        )
        if (Object.keys(missedRequirementsByUrl).length) {
          missedRequirements[url] = missedRequirementsByUrl
        }
      }

      mappedResults.metrics = R.mergeAll(
        R.compose(
          R.map(R.pathOr(null, ['audits', 'metrics'])),
          R.values
        )(mappedResults)
      )

      mappedResults = R.map(
        R.omit([
          // 'audits',
          // 'categories',
          // 'i18n',
          // 'configSettings',
          // 'environment',
          // 'categoryGroups'
        ]),
        mappedResults
      )

      mappedResults['missedRequirements'] = missedRequirements

      return promisify(fs.writeFile)(
        './lighthouseReport.json',
        JSON.stringify(mappedResults, null, 2)
      ).then(() => {
        let failures = {}
        if (Object.keys(missedRequirements).length) {
          failures['missed requirements'] = R.compose(
            R.uniq,
            R.values,
            R.map(R.prop('id')),
            obj => flatten(obj, '.', x => x.id)
          )(missedRequirements)
        }
        assert.equal(
          Object.keys(failures),
          0,
          JSON.stringify(failures, null, 2)
        )
      })
    })
  }).timeout(30000)
})
