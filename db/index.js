const mysql = require('mysql')
const debug = require('../env').debug;
const {
  host, user, password, database
} = require('./config')

function orLike(where, k, v) {
  if (where === 'where') {
    return where + ` ${k} like '%${v}%'`
  } else {
    return where + ` or ${k} like '%${v}%'`
  }
}

function or(where, k, v) {
  if (where === 'where') {
    return where + ` ${k}='${v}'`
  } else {
    return where + ` or ${k}='${v}'`
  }
}

function connect() {
  const conn = mysql.createConnection({
    host,
    user,
    password,
    database,
    multipleStatements: true
  })
  return conn
}

function querySql(sql, onSuccess, onFail) {
  const conn = connect()
  debug && console.log(sql)
  conn.query(sql, (err, results) => {
    if (err) {
      console.log('操作失败，原因:' + JSON.stringify(err))
      onFail && onFail()
    } else {
      // debug && console.log('操作成功', JSON.stringify(results))
      onSuccess && onSuccess(results)
    }
    conn.end()
  })
}

function querySqlList(sql, onSuccess, onFail) {
  const conn = connect()
  debug && console.log(sql)
  const resultList = []
  let index = 0
  function next() {
    index++
    if (index < sql.length) {
      query()
    } else {
      conn.end()
      onSuccess && onSuccess(resultList)
    }
  }
  function query() {
    conn.query(sql[index], (err, results) => {
      if (err) {
        console.log('操作失败，原因:' + JSON.stringify(err))
        onFail && onFail()
      } else {
        // debug && console.log('操作成功', JSON.stringify(results))
        resultList.push(results)
        next()
      }
    })
  }
  query()
}

module.exports = {
  connect,
  querySql,
  querySqlList,
  orLike,
  or
}
