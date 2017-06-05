// import request from 'request'
// import cheerio from 'cheerio'
// import URL from 'url-parse'

const _ = require('lodash')
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

// crawlIndexes(INDEX_URLS)
crawlIndexes([DEBUG_URL])

function crawlIndexes(indexes) {
  const allLinks = []
  const finishedCallback = _.after(indexes.length, () => {
    console.log(allLinks)
  })

  for (let i = 0; i < indexes.length; i++) {
    const index = indexes[i]
    loadPage(index, _.partialRight(parsePage, links => {
      allLinks.push(...links)
      finishedCallback()
    }))
  }
}

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

function parsePage(index, body, callback) {
  // Parse the document body
  const $ = cheerio.load(body)

  const linkValidator = RegExp('.*ASG\\w{5}$')
  const filteredTags = _.filter(
    $("a[href^='/']"),
    link => linkValidator.test(link.attribs.href))
  const filteredLinks = _.map(filteredTags, tag => tag.attribs.href)

  const url = new URL(index)
  const baseUrl = `${url.protocol}//${url.hostname}`
  const absolutePaths = []

  _.forEach(filteredLinks, link => {
    absolutePaths.push(baseUrl + link)
  })

  if (callback) { callback(absolutePaths) }
  return absolutePaths
}
