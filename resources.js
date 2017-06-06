const crypto = require('crypto')
const request = require('request')
const fs = require('fs')
const util = require('util')

function loadPage(index, callback) {
  const indexHash = crypto.createHash('md5').update(index).digest('hex')
  const cachePath = `cache/${indexHash}.html`

  fs.readFile(cachePath, (readError, data) => {
    if (!readError) { callback(index, data) }
    else {
      request(index, (error, response, body) => {
        // Check status code (200 is HTTP OK)
        console.log(`Loaded ${index} with code:`, response.statusCode)
        if (response.statusCode !== 200) { throw error }

        fs.writeFile(cachePath, body, writeError => {
          if (writeError) { throw writeError }
          console.log(`Wrote ${cachePath} to cache.`)
        })

        callback(index, body)
      })
    }
  })
}

function savePage(descriptor, callback) {
  const indexHash = crypto.createHash('md5').update(descriptor.url).digest('hex')
  const cachePath = `output/${indexHash}.txt`
  fs.writeFile(cachePath, util.inspect(descriptor), writeError => {
    if (writeError) { throw writeError }
    console.log(`Wrote ${cachePath} to output.`)
    callback()
  })
}

module.exports.savePage = savePage
module.exports.loadPage = loadPage
