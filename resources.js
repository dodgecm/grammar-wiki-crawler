const _ = require('lodash')
const crypto = require('crypto')
const request = require('request')
const fs = require('fs')
const util = require('util')

let fileIndex = 1

function loadPage(index, callback) {
  const indexHash = crypto.createHash('md5').update(index).digest('hex')
  const cachePath = `cache/${indexHash}.html`

  fs.readFile(cachePath, (readError, data) => {
    if (!readError) { callback(index, data) }
    else {
      request(index, (error, response, body) => {
        // Check status code (200 is HTTP OK)
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
  const cachePath = `output/${_.padStart(fileIndex, 4, '0')}_${descriptor.id}.txt`
  fileIndex++
  fs.writeFile(cachePath, util.inspect(descriptor), writeError => {
    if (writeError) { throw writeError }
    console.log(`Wrote ${descriptor.title} to output.`)
    callback()
  })
}

module.exports.savePage = savePage
module.exports.loadPage = loadPage
