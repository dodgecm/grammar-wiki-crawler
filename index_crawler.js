// import request from 'request'
// import cheerio from 'cheerio'
// import URL from 'url-parse'

const request = require('request')
const cheerio = require('cheerio')
const URL = require('url-parse')
const fs = require('fs')
const crypto = require('crypto')

const INDEX_URLS = [
  'https://resources.allsetlearning.com/chinese/grammar/A1_grammar_points',
  'https://resources.allsetlearning.com/chinese/grammar/A2_grammar_points',
  'https://resources.allsetlearning.com/chinese/grammar/B1_grammar_points',
  'https://resources.allsetlearning.com/chinese/grammar/B2_grammar_points',
  'https://resources.allsetlearning.com/chinese/grammar/C1_grammar_points',
]

const DEBUG_URL = 'https://resources.allsetlearning.com/chinese/grammar/A1_grammar_points'

const pagesToVisit = []
let baseUrl

crawlIndexes(INDEX_URLS)
// crawlIndexes([DEBUG_URL])

function crawlIndexes(indexes) {
  for (let i = 0; i < indexes.length; i++) {
    const index = indexes[i]
    const url = new URL(index)
    baseUrl = `${url.protocol}//${url.hostname}`
    loadPage(index, parsePage)
  }
}

function loadPage(index, callback) {
  const indexHash = crypto.createHash('md5').update(index).digest('hex')
  const cachePath = `cache/${indexHash}.html`

  fs.readFile(cachePath, (readError, data) => {
    if (!readError) { callback(data) }
    else {
      request(index, (error, response, body) => {
        // Check status code (200 is HTTP OK)
        console.log(`Loaded ${index} with code:`, response.statusCode)
        if (response.statusCode !== 200) { throw error }

        fs.writeFile(cachePath, body, writeError => {
          if (writeError) { throw writeError }
          console.log(`Wrote ${cachePath} to cache.`)
        })

        callback(body)
      })
    }
  })
}

function parsePage(body) {
  // Parse the document body
  const $ = cheerio.load(body)
  collectInternalLinks($)
}

function collectInternalLinks($) {
  const relativeLinks = $("a[href^='/']")
  console.log(`Found ${relativeLinks.length} relative links on page`)
  relativeLinks.each(() => {
    pagesToVisit.push(baseUrl + $(this).attr('href'))
  })
}
