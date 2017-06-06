const _ = require('lodash')
const cheerio = require('cheerio')
const resources = require('./resources')

function crawlGrammarPages(descriptors, callback) {
  const finishedCallback = _.after(descriptors.length, () => {
    callback()
  })

  _.forEach(descriptors, descriptor => {
    resources.loadPage(descriptor.url,
      _.partialRight(parseIndexPage, descriptor, finishedCallback))
  })
}

function parseIndexPage(index, body, descriptor, callback) {
  const $ = cheerio.load(body)

  const examples = []
  $('.liju li').each((i, elem) => {
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
  console.log(details)
  callback()
}

module.exports.crawlGrammarPages = crawlGrammarPages
