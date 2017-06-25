# grammar-wiki-crawler

This Node.js project scrapes AllSet Learning's [Chinese Grammar Wiki](https://resources.allsetlearning.com/chinese/grammar/Main_Page) for example sentences that can be imported into Anki.

## Installation

[Node.js](http://nodejs.org/) `>= 6` is required.  Additionally, you will need to install some npm dependencies.
```shell
npm install
```

## Run

```shell
node src/index_crawler.js
```

## Output

The script outputs a text file with the scraped data at `output/deck.txt`.

## License

The source code for this scraper is licensed under the MIT license.  However, all content scraped from the CGW is made available under the [Creative Common license](https://creativecommons.org/licenses/by-nc-sa/3.0/#).
