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
    $(elem).parents().hasClass('liju-en') ||
    $(elem).children('a').length > 0) {
      console.log('Filtered out', $(elem).text())
      return true
    }

    const dialogExp = RegExp('^[A-Z]:')
    if ($(elem).parent().hasClass('dialog') ||
        dialogExp.test($(elem).text().trim())) {
      // We filter out the second person's line to combine the dialogue into one card
      if ($(elem).prev().length !== 0) {
        console.log('Filtered out', $(elem).text())
      } else {
        const dialogueSegments = { hanzi: [], '.pinyin': [], '.trans': [], '.expl': [] }
        const terms = ['.pinyin', '.trans', '.expl']

        dialogueSegments.hanzi.push($(elem).contents().not(_.join(terms, ', ')).text().replace(/\s+/g, ''))
        $(elem).nextAll('li').each((i, example) => {
          dialogueSegments.hanzi.push($(example).contents().not(_.join(terms, ', ')).text().replace(/\s+/g, ''))
        })

        _.forEach(terms, term => {
          dialogueSegments[term].push($(elem).find(term).text().trim())
          $(elem).nextAll('li').each((i, example) => {
            dialogueSegments[term].push($(example).find(term).text().trim())
          })
          _.remove(dialogueSegments[term], term => term.length === 0)
        })

        if (dialogueSegments.hanzi.length === 0 ||
        dialogueSegments['.trans'].length === 0) {
          console.log('Filtered out', $(elem).text())
          return true
        }

        examples.push({
          hanzi: _.join(dialogueSegments.hanzi, '<br />'),
          pinyin: _.join(dialogueSegments['.pinyin'], '<br />'),
          trans: _.join(dialogueSegments['.trans'], '<br />'),
          expl: _.join(dialogueSegments['.expl'], ''),
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
