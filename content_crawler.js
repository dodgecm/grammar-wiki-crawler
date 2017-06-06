const _ = require('lodash')
const cheerio = require('cheerio')
const resources = require('./resources')
const merge = require('merge')

function crawlGrammarPages(descriptors, callback) {
  const pageDescriptors = []
  const finishedCallback = _.after(descriptors.length, () => {
    callback(pageDescriptors)
  })

  _.forEach(descriptors, descriptor => {
    resources.loadPage(descriptor.url,
      _.partialRight(parseIndexPage, descriptor, newDescriptor => {
        pageDescriptors.push(newDescriptor)
        finishedCallback()
      }),
    )
  })
}

function parseIndexPage(index, body, descriptor, callback) {
  const $ = cheerio.load(body)

  const examples = []
  $('.liju li').each((i, elem) => {
    // Filter out examples of right vs wrong grammar segments, etc
    if ($(elem).hasClass('x') ||
    $(elem).hasClass('o') ||
    $(elem).parents().hasClass('liju-en')) {
      console.log('Filtered out', $(elem).text())
      return true
    }

    examples.push({
      hanzi: $(elem).contents().not('.pinyin, .trans, .expl').text().replace(/\s+/g, ''),
      pinyin: $(elem).find('.pinyin').text().trim(),
      trans: $(elem).find('.trans').text().trim(),
      expl: $(elem).find('.expl').text().trim(),
    })
  })

  const details = {
    level: $('.ibox-info').first().text().trim(),
    structure: $('.jiegou').first().text().trim(),
    summary: $('#mw-content-text p').first().text().trim(),
    examples,
  }

  callback(merge(descriptor, details))
}

module.exports.crawlGrammarPages = crawlGrammarPages
