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

    if ($(elem).parent().hasClass('dialog')) {
      // We filter out the second person's line to combine the dialogue into one card
      if ($(elem).prev().length !== 0) {
        console.log('Filtered out', $(elem).text())
      } else {
        examples.push({
          hanzi: _.join([
            $(elem).contents().not('.pinyin, .trans, .expl').text().replace(/\s+/g, ''),
            $(elem).next().contents().not('.pinyin, .trans, .expl').text().replace(/\s+/g, ''),
          ], '\n'),
          pinyin: _.join([
            $(elem).find('.pinyin').text().trim(),
            $(elem).next().find('.pinyin').text().trim(),
          ], '\n'),
          trans: _.join([
            $(elem).find('.trans').text().trim(),
            $(elem).next().find('.trans').text().trim(),
          ], '\n'),
          expl: _.join([
            $(elem).find('.expl').text().trim(),
            $(elem).next().find('.expl').text().trim(),
          ], '\n'),
        })
      }
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
