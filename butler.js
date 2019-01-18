importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js'
)

const appName = 'astral'
const version = '8'
const pageRevision = `${version}-1`
const landingPages = '/ /account /cart'
  .split(' ')
  .reduce((a, x) => Object.assign(a, { [x]: 1 }), {})

if (workbox) {
  workbox.core.setCacheNameDetails({
    prefix: appName,
    suffix: version
  })

  // workbox.precaching.precache(
  //   Object.keys(landingPages).map(url => ({ url, revision: pageRevision }))
  // )

  workbox.routing.registerRoute(
    ({ url }) =>
      url.host === self.location.host && url.pathname in landingPages,
    workbox.strategies.networkFirst({
      cacheName: `${appName}-page-cache-${version}`
    })
  )

  workbox.routing.registerRoute(
    /.*\.js/,
    workbox.strategies.networkFirst({
      cacheName: `${appName}-js-cache-${version}`
    })
  )

  workbox.routing.registerRoute(
    // Cache CSS files
    /.*\.css/,
    // Use cache but update in the background ASAP
    workbox.strategies.staleWhileRevalidate({
      // Use a custom cache name
      cacheName: `${appName}-css-cache-${version}`
    })
  )
  workbox.routing.registerRoute(
    // Cache image files
    /.*\.(?:png|jpg|jpeg|svg|gif)/,
    // Use the cache if it's available
    workbox.strategies.cacheFirst({
      // Use a custom cache name
      cacheName: `${appName}-image-cache-${version}`,
      plugins: [
        new workbox.expiration.Plugin({
          // Cache only 20 images
          maxEntries: 20,
          // Cache for a maximum of a week
          maxAgeSeconds: 7 * 24 * 60 * 60
        })
      ]
    })
  )
}

console.log('at your service!')
