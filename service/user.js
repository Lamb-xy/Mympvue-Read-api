const db = require('../db')

/**
 * 签到
 *
 * @param openId
 * @param onSuccess
 * @param onFail
 */
function sign(openId, onSuccess, onFail) {
  const sql = `INSERT INTO \`book\`.\`sign\`(\`openId\`, \`create_dt\`) VALUES ('${openId}', ${new Date().getTime()});`
  db.querySql(sql, onSuccess, onFail)
}

function getSign(openId, onSuccess, onFail) {
  const sql = `SELECT * FROM sign WHERE openId='${openId}' order by create_dt desc`
  db.querySql(
    sql,
    (results) => {
      onSuccess && onSuccess(results)
    },
    onFail)
}

/**
 * 注册用户
 *
 * @param user
 * @param onSuccess
 * @param onFail
 */
function register(user, onSuccess, onFail) {
  // 对用户数据进行初始化
  const { city = '', country = '', gender = 0, language = '', province = '' } = user
  // 查询该用户是否已经注册过，如果未注册，再进行注册
  const querySql = `select * from user where openId='${user.openId}'`
  db.querySql(querySql,
    (results) => {
      if (results && results.length === 0) {
        const sql = `INSERT INTO \`user\`(openId, avatarUrl, city, country, gender, language, nickName, province, create_dt, platform) VALUES ('${user.openId}', '${user.avatarUrl}', '${city}', '${country}', '${gender}', '${language}', '${user.nickName}', '${province}', ${new Date().getTime()}, '${user.platform}')`
        db.querySql(sql, onSuccess, onFail)
      } else {
        const sql = `UPDATE \`book\`.\`user\` SET \`openId\` = '${user.openId}', \`avatarUrl\` = '${user.avatarUrl}', \`city\` = '${city}', \`country\` = '${country}', \`gender\` = '${gender}', \`language\` = '${language}', \`nickName\` = '${user.nickName}', \`province\` = '${province}', \`update_dt\` = '${new Date().getTime()}', \`platform\` = '${user.platform}' WHERE \`openId\` = '${user.openId}'`
        db.querySql(sql, onSuccess, onFail)
      }
    }, onFail)
}

/**
 * 计算加入平台时间
 *
 * @param openId
 * @param onSuccess
 * @param onFail
 */
function day(openId, onSuccess, onFail) {
  const sql = `select * from \`user\` where openId='${openId}'`
  console.log('天数查询',sql)
  db.querySql(
    sql,
      (results) => {
      if (results && results.length > 0) {
        const user = results[0]
        const start = user.create_dt
        const now = new Date().getTime()
        const day = Math.ceil((now - start) / 1000 / 3600 / 24)
        onSuccess && onSuccess({ day })
      } else {
        onFail && onFail()
      }
    },
    onFail
  )
}

module.exports = {
  register,
  day,
  sign,
  getSign
}
