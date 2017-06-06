const _ = require('lodash')
const cheerio = require('cheerio')
const URL = require('url-parse')
const resources = require('./resources')
const content = require('./content_crawler')

const INDEX_URLS = [
  'https://resources.allsetlearning.com/chinese/grammar/A1_grammar_points',
  'https://resources.allsetlearning.com/chinese/grammar/A2_grammar_points',
  'https://resources.allsetlearning.com/chinese/grammar/B1_grammar_points',
  'https://resources.allsetlearning.com/chinese/grammar/B2_grammar_points',
  'https://resources.allsetlearning.com/chinese/grammar/C1_grammar_points',
]

const DEBUG_URL = 'https://resources.allsetlearning.com/chinese/grammar/B1_grammar_points'
const DEBUG_PAGE = 'https://resources.allsetlearning.com/chinese/grammar/ASGV55Y4'
const DEBUG_SINGLE_PAGE = false

// crawlIndexes(INDEX_URLS)
crawlIndexes([DEBUG_URL])

function crawlIndexes(indexes) {
  const pageDescriptors = []
  const finishedCallback = _.after(indexes.length, () => {
    if (DEBUG_SINGLE_PAGE) {
      _.remove(pageDescriptors, page => page.url !== DEBUG_PAGE)
    }

    content.crawlGrammarPages(pageDescriptors, finishedDescriptors => {
      const writeDeckCallback = _.after(finishedDescriptors.length, () => {
        resources.saveDeck(() => {
          console.log('Done!')
        })
      })
      _.forEach(finishedDescriptors, descriptor => {
        resources.savePage(descriptor, writeDeckCallback)
      })
    })
  })

  _.forEach(indexes, index => {
    resources.loadPage(index, _.partialRight(parseIndexPage, descriptors => {
      pageDescriptors.push(...descriptors)
      finishedCallback()
    }))
  })
}

let pageId = 1
function parseIndexPage(index, body, callback) {
  // Parse the document body
  const $ = cheerio.load(body)

  const linkValidator = RegExp('.*ASG\\w{5}$')
  const filteredTags = _.filter(
    $("a[href^='/']"),
    link => linkValidator.test(link.attribs.href))

  const url = new URL(index)
  const baseUrl = `${url.protocol}//${url.hostname}`
  const pageDescriptors = []

  _.forEach(filteredTags, tag => {
    pageDescriptors.push({
      id: pageId,
      url_id: tag.attribs.href.substring(tag.attribs.href.length - 8),
      href: tag.attribs.href,
      url: baseUrl + tag.attribs.href,
      title: $(tag).text(),
      pattern: $(tag).closest('td').next().text(),
      category: $(tag).closest('.wikitable').prevAll('h2').first().text().replace(/\s+/g, '_'),
      subcategory: $(tag).closest('.wikitable').prev().text().replace(/\s+/g, ''),
    })
    pageId++
  })

  if (callback) { callback(pageDescriptors) }
  return pageDescriptors
}
