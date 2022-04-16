const db = require('../db')
const bookSearch = require('./book')

function saveHotBook(p, onSuccess, onFail) {
  if (p && p.openId && p.fileName && p.title) {
    const sql = `INSERT INTO \`hot_book\`(openId, title, fileName, create_dt) VALUES ('${p.openId}', '${p.title}', '${p.fileName}', ${new Date().getTime()})`
    db.querySql(sql, onSuccess, onFail)
  }
}

function hotSearch(onSuccess, onFail) {
  // const sql = 'select * from (select keyword, count(*) as num from hot_search group by keyword) as t1 order by num desc, keyword asc limit 10;'
  const sql = 'SELECT title, fileName FROM `hot_book_order` ' +
    'WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM `hot_book_order`))) ' +
    'ORDER BY id LIMIT 10'
  db.querySql(sql, onSuccess, onFail)
}

function saveHotSearch(p, onSuccess, onFail) {
  if (p && p.openId && p.keyword) {
    const sql = `INSERT INTO \`hot_search\`(openId, keyword, create_dt) VALUES ('${p.openId}', '${p.keyword}', ${new Date().getTime()})`
    db.querySql(sql, onSuccess, onFail)
  }
}

function search(p, onSuccess, onFail) {
  if (!p || !p.keyword) {
    onFail && onFail()
    return
  }
  const page = p.page || 1;
  const pageSize = p.pageSize || 20;
  const offset = (page - 1) * pageSize;
  const sql = [
    `select * from book where title like '%${p.keyword}%' limit ${pageSize} offset ${offset}`,
    `select author from book where author like '%${p.keyword}%' limit 1`,
    `select * from (select category, categoryText from book group by category) as t1 where categoryText like '%${p.keyword}%' limit 1`,
    `select * from (select publisher from book group by publisher) as t1 where publisher like '%${p.keyword}%' limit 1`
  ]
  function handleSuccess(results) {
    const book = results[0]
    const author = results[1]
    const category = results[2]
    const publisher = results[3]
    book && book.map(item => {
      return bookSearch.wrapper(item)
    })
    onSuccess && onSuccess({
      book, author, category, publisher
    })
  }
  db.querySqlList(sql, handleSuccess, onFail)
}

function searchBook(p, onSuccess, onFail) {
  let where = 'where'
  p.publisher && (where = db.orLike(where, 'publisher', p.publisher))
  p.author && (where = db.orLike(where, 'author', p.author))
  p.category && (where = db.orLike(where, 'categoryText', p.category))
  p.categoryId && (where = db.or(where, 'category', p.categoryId))
  const page = p.page || 1;
  const pageSize = p.pageSize || 20;
  const offset = (page - 1) * pageSize;
  const sql = `select * from book ${where} limit ${pageSize} offset ${offset}`
  function handleSuccess(results) {
    results && results.map(item => {
      return bookSearch.wrapper(item)
    })
    onSuccess && onSuccess(results)
  }
  db.querySql(sql, handleSuccess, onFail)
}

module.exports = {
  search,
  saveHotSearch,
  hotSearch,
  saveHotBook,
  searchBook
}
