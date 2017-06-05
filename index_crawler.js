// import request from 'request'
// import cheerio from 'cheerio'
// import URL from 'url-parse'

const request = require('request')
const cheerio = require('cheerio')
const URL = require('url-parse')

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

// crawlIndexes(INDEX_URLS)
crawlIndexes([DEBUG_URL])

function crawlIndexes(indexes) {
  for (let i = 0; i < indexes.length; i++) {
    const index = indexes[i]
    const url = new URL(index)
    baseUrl = `${url.protocol}//${url.hostname}`
    visitPage(index)
  }
}

function visitPage(url) {
  // Make the request
  console.log('Visiting page ', url)
  request(url, (error, response, body) => {
    // Check status code (200 is HTTP OK)
    console.log('Status code: ', response.statusCode)
    if (response.statusCode !== 200) { return }

    // Parse the document body
    const $ = cheerio.load(body)
    collectInternalLinks($)
  })
}

function collectInternalLinks($) {
  const relativeLinks = $("a[href^='/']")
  console.log(`Found ${relativeLinks.length} relative links on page`)
  relativeLinks.each(() => {
    pagesToVisit.push(baseUrl + $(this).attr('href'))
  })
}
