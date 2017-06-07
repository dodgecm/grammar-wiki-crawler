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
      console.log('Filtered out', $(elem).text(), descriptor.title)
      return true
    }

    // If we match an A:, B:, 什么的 exactly once, it's dialogue and needs to be handled differently
    const elementText = $(elem).text().trim()
    const dialogExp = RegExp('[A-Z][:：]')
    const multilineDialogExp = RegExp('[A-Z][:：].*[A-Z][:：]')
    if ($(elem).parent().hasClass('dialog') ||
        (dialogExp.test(elementText) &&
        !multilineDialogExp.test(elementText))) {
      // We filter out the second person's line to combine the dialogue into one card
      if ($(elem).prev().length !== 0) {
        console.log('Dialogue combined for', $(elem).text(), descriptor.title)
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
          console.log('Missing fields for', $(elem).text(), descriptor.title)
          return true
        }

        // Breaks all dialogue segments into groups of 2, or 3 if there's an uneven amount
        for (let i = 0; i < dialogueSegments.hanzi.length; i += 2) {
          const remaining = dialogueSegments.hanzi.length - i
          const end = (remaining > 3) ? i + 2 : dialogueSegments.hanzi.length
          examples.push({
            hanzi: _.join(_.slice(dialogueSegments.hanzi, i, end), '<br />'),
            pinyin: _.join(_.slice(dialogueSegments['.pinyin'], i, end), '<br />'),
            trans: _.join(_.slice(dialogueSegments['.trans'], i, end), '<br />'),
            expl: _.join(_.slice(dialogueSegments['.expl'], i, end), ''),
          })
        }
      }
      return true
    }

    const example = {
      hanzi: $(elem).contents().not('.pinyin, .trans, .expl').text().replace(/\s+/g, ''),
      pinyin: $(elem).find('.pinyin').text().trim(),
      trans: $(elem).find('.trans').text().trim(),
      expl: $(elem).find('.expl').text().trim(),
      structure: $(elem).closest('.liju').prevAll('.jiegou').first().text().trim(),
    }

    if (example.trans.length === 0 || example.hanzi.length === 0) {
      console.log('Missing fields for', $(elem).text(), descriptor.title)
      return true
    }

    examples.push(example)
  })

  const details = {
    level: $('.ibox-info').first().text().trim(),
    summary: $('#mw-content-text p').first().text().trim(),
    examples,
  }

  callback(merge(descriptor, details))
}

module.exports.crawlGrammarPages = crawlGrammarPages
