const mysql = require('mysql')

function connect() {
  const conn = mysql.createConnection({
    // host: '127.0.0.1',
    // user: 'root',
    // password: '123456',
    // database: 'imooc_ebook',
    host: '47.99.166.157',
    user: 'root',
    password: 'Xds840126',
    database: 'book',
    multipleStatements: true
  })
  return conn
}

function saveToShelf(shelf, onSuccess, onFail) {
  querySql(`INSERT INTO \`shelf\`(fileName, openId, \`date\`) VALUES ('${shelf.fileName}', '${shelf.openId}', ${new Date().getTime()})`, onSuccess, onFail)
}

function getShelfByOpenId(shelf = null, onSuccess, onFail) {
  if (!shelf) {
    onFail && onFail()
    return
  }
  let where = ''
  if (shelf.openId) {
    where += `t1.openId='${shelf.openId}'`
  }
  if (shelf.fileName) {
    if (where.length > 0) {
      where += ` and t1.fileName='${shelf.fileName}'`
    } else {
      where = `t1.fileName='${shelf.fileName}'`
    }
  }
  const sql = `select t1.fileName, t1.openId, t1.\`date\`, t2.id, t2.cover, t2.title, t2.author, t2.publisher, t2.bookId, t2.category, t2.categoryText, t2.\`language\`, t2.rootFile from shelf as t1 left join book as t2 on t1.fileName=t2.fileName where ${where} order by t1.\`date\` asc`
  querySql(sql, onSuccess, onFail)
}

function removeFromShelf(shelf, onSuccess, onFail) {
  querySql(`DELETE FROM \`shelf\` where fileName='${shelf.fileName}' and openId='${shelf.openId}'`, onSuccess, onFail)
}

function querySql(sql, onSuccess, onFail) {
  const conn = connect()
  console.log(sql)
  conn.query(sql, (err, results) => {
    if (err) {
      console.log('操作失败，原因:' + JSON.stringify(err))
      onFail && onFail()
    } else {
      console.log('操作成功', JSON.stringify(results))
      onSuccess && onSuccess(results)
    }
    conn.end()
  })
}

module.exports = {
  saveToShelf,
  getShelfByOpenId,
  removeFromShelf
}
