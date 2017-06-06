const _ = require('lodash')
const crypto = require('crypto')
const request = require('request')
const fs = require('fs')
const util = require('util')

const HUMAN_READABLE_OUTPUT = false

function createDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

function loadPage(index, callback) {
  createDirSync('cache')
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
  const outputDir = 'output'
  createDirSync(outputDir)

  const cachePath = `${outputDir}/${_.padStart(descriptor.id, 4, '0')}_${descriptor.url_id}.json`
  fs.writeFile(cachePath, JSON.stringify(descriptor), writeError => {
    if (writeError) { throw writeError }
    console.log(`Wrote ${descriptor.title} to output.`)
    callback()
  })

  if (HUMAN_READABLE_OUTPUT) {
    const humanReadablePath = `output/${_.padStart(descriptor.id, 4, '0')}_${descriptor.url_id}.txt`
    fs.writeFile(humanReadablePath, util.inspect(descriptor), () => {})
  }
}

function saveDeck(callback) {
  const outputDir = 'output'
  createDirSync(outputDir)

  const files = fs.readdirSync(outputDir)
  _.remove(files, file => !_.endsWith(file, '.json'))

  const writeStream = fs.createWriteStream('output/deck.txt')
  files.forEach(file => {
    const data = fs.readFileSync(`output/${file}`)
    const { examples, level, category, subcategory, title, structure, url } = JSON.parse(data)
    const tags = _.join([level, category, subcategory], ' ')
    examples.forEach(({ hanzi, pinyin, trans, expl }) => {
      const row = [hanzi, pinyin, trans, expl, title, structure, url, tags]
      // const row = [hanzi, trans, title]
      writeStream.write(`${_.join(row, '\t')}\n`)
    })
  })

  callback()
}

module.exports.saveDeck = saveDeck
module.exports.savePage = savePage
module.exports.loadPage = loadPage
