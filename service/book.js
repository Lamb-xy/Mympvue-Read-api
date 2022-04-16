const db = require('../db')
const resUrl = require('../const').resUrl

function wrapper(data) {
  if (!data.cover.startsWith('http://')) {
    data['cover'] = `${resUrl}/img${data.cover}`
  }
  return data
}

function wrapperCover(cover) {
  if (!cover.startsWith('http://')) {
    cover = `${resUrl}/img${cover}`
  }
  return cover
}

function getBookDetailReader(fileName, openId, onSuccess, onFail) {
  const sql = [
    'select t2.avatarUrl, t2.nickName, t1.create_dt ' +
    'from (select openId, title, fileName, max(create_dt) as create_dt ' +
    'from hot_book ' +
    'where fileName=\'' + fileName + '\' ' +
    'group by openId ' +
    'order by create_dt desc ' +
    'limit 10) as t1 ' +
    'left join `user` as t2 on t1.openId=t2.openId',
    'select count(*) as count from hot_book where fileName=\'' + fileName + '\'',
    `select * from \`rank\` where fileName='${fileName}' and openId='${openId}'`,
    `select count(*) as count, ROUND(avg(\`rank\`), 2) as \`rank\` from \`rank\` where fileName='${fileName}'`
  ]
  db.querySqlList(sql, onSuccess, onFail)
}

function saveBookRank(fileName, openId, rank, onSuccess, onFail) {
  const querySql = `select * from \`rank\` where fileName='${fileName}' and openId='${openId}'`
  const insertSql = `INSERT INTO \`rank\`(fileName, openId, \`rank\`, create_dt) VALUES ('${fileName}', '${openId}', '${rank}', ${new Date().getTime()})`
  const updateSql = `update \`rank\` set \`rank\`='${rank}',create_dt=${new Date().getTime()} where fileName='${fileName}' and openId='${openId}'`
  function handleQuery(results) {
    if (results.length > 0) {
      db.querySql(updateSql, onSuccess, onFail)
    } else {
      db.querySql(insertSql, onSuccess, onFail)
    }
  }
  db.querySql(querySql, handleQuery, onFail)
}

module.exports = {
  wrapper,
  wrapperCover,
  getBookDetailReader,
  saveBookRank
}
