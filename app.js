const express = require('express')
// 实例化express对象
const app = express()

const cors = require('cors')
// 解决请求跨域
app.use(cors())

const timeout = require('connect-timeout')
// 设置请求超时时间
app.use(timeout('5s'))

const bodyParser = require('body-parser')
// 解析 application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// 解析 application/json
app.use(bodyParser.json())

const fs = require('fs')
const utils = require('./utils')
const appIdMap = require('./alipay/appIdmap.js')
const request = require('request')
const homeService = require('./service/home')
const shelfService = require('./service/shelf')
const searchService = require('./service/search')
const userService = require('./service/user')
const bookService = require('./service/book')
const { resUrl, fileUrl2 } = require('./const')
const { connect } = require('./db')
const {
  OPEN_ID_NOT_NULL,
  QUERY_OK,
  QUERY_FAILED
} = require('./utils/msg')

// 通用方法，用来处理失败时的响应值
function onFail(res, msg, code = -1, data = null) {
  const result = {
    error_code: code,
    msg: msg
  }
  data && (result.data = data)
  res.json(result)
}

// 通用方法，用来处理成功时的响应值
function onSuccess(res, msg, data = {}, code = 0) {
  res.json({
    error_code: code,
    msg: msg,
    data
  })
}

app.get('/', function(req, res) {
  res.send('欢迎学习mpvue实战多平台小程序')
})

/*
 *********************
 ** 小程序首页相关API **
 *********************
 */
// 获取首页数据
app.get('/book/home/v2', (req, res) => {
  let openId = req.query.openId
  if (!openId) {
    onFail(res, OPEN_ID_NOT_NULL)
  } else {
    openId = decodeURIComponent(openId)
    homeService.home(
      openId,
      (results) => onSuccess(res, QUERY_OK, results),
      () => onFail(res, QUERY_FAILED)
    )
  }
})

// 获得微信openId
app.get('/openId/get', (req, res) => {
  const appId = req.query.appId
  const code = req.query.code
  if (!appId || !code) {
    onFail(res, '获取appId失败')
  } else {
    let secret = (appIdMap && appIdMap[appId]) || ''
    if (!secret) {
      secret = req.query.secret
    }
    if (secret) {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
      request.get(url, function(err, response, body) {
        if (!err) {
            // console.log(response);
          const data = JSON.parse(body)
          if (data.session_key && data.openid) {
            onSuccess(res, '获取openId成功', data)
          } else {
            onFail(res, '获取openId失败')
          }
        } else {
          onFail(res, '获取openId失败')
        }
      })
    } else {
      onFail(res, '获取密钥失败')
    }
  }
})

// 获取支付宝openId
const AlipaySdk = require('alipay-sdk').default
app.get('/openId/get/alipay', (req, res) => {
  const appId = req.query.appId
  const code = req.query.code
  if (!appId || !code) {
    onFail(res, '获取openId失败')
  } else {
    const alipaySdk = new AlipaySdk({
      appId,
      privateKey: fs.readFileSync(appIdMap[appId], 'ascii')
    })
    alipaySdk.exec('alipay.system.oauth.token', {
      grantType: 'authorization_code',
      code,
      refreshToken: 'token'
    }).then(result => {
      console.log('alipay', result)
      if (result) {
        const { alipayUserId, userId, accessToken } = result
        onSuccess(res, '获取openId成功', {
          openid: `${userId}|${alipayUserId}`,
          session_key: accessToken
        })
      } else {
        onFail(res, '获取openId失败')
      }
    }).catch(err => {
      onFail(res, '获取openId失败', err)
    })
  }
})

// 用户注册
app.post('/user/register', (req, res) => {
    const openId = req.body.openId
  let platform = req.body.platform
  if (!platform) {
    req.body.platform = 'wx'
  }
  if (!openId) {
    onFail(res, OPEN_ID_NOT_NULL)
  } else {
    userService.register(
      req.body,
      (results) => onSuccess(res, '用户注册成功'),
      () => onFail(res, '用户注册失败')
    )
  }
})

// 判断用户今天是否已经签到
app.get('/user/hasSignToday', (req, res) => {
  const openId = req.query.openId
  if (!openId) {
    onFail(res, OPEN_ID_NOT_NULL)
  } else {
    userService.getSign(
      openId,
      (results) => {
        if (results.length > 0) {
          const now = new Date()
          // 结果是按时间倒序的，所以获取第一个，就是最近的一次签到
          const result = results[0]
          const recentSignDate = new Date(result.create_dt)
          let hasSignToday
          // 和最近一次签到时间相隔不足24小时，说明是今天签到的
          if (utils.isSameDay(now, recentSignDate)) {
            hasSignToday = true
          } else {
            hasSignToday = false
          }
          // 判断连续签到天数
          let continueSignDay = 0
          let nextDay = now
          // 如果今天签到了，连续签到先加1
          if (hasSignToday) {
            continueSignDay++
          }
          // 如果今天签到了，则从倒数第二开始计算，否则从第一次签到开始
          const firstIndex = hasSignToday ? 1 : 0
          for (let i = firstIndex; i < results.length; i++) {
            // 获取最近的第二次签到
            const r = results[i]
            // 获取签到的日期
            const signDate = new Date(r.create_dt)
            // 获取今天前一天的日期
            nextDay = utils.previousDate(nextDay)
            if (utils.isSameDay(nextDay, signDate)) {
              continueSignDay++
            } else {
              break
            }
          }
          onSuccess(res, '获取签到数据成功', { hasSignToday, continueSignDay })
        } else {
          onSuccess(res, '尚未签到', { hasSignToday: false, continueSignDay: 0 })
        }
      },
      () => onFail(res, '获取签到状态失败')
    )
  }
})

// 用户签到
app.get('/user/sign', (req, res) => {
  const openId = req.query.openId
  if (!openId) {
    onFail(res, OPEN_ID_NOT_NULL)
  } else {
    userService.sign(
      openId,
      () => onSuccess(res, '用户签到成功'),
      () => onFail(res, '用户签到失败')
    )
  }
})

// 推荐阅读
app.get('/book/home/recommend/v2', (req, res) => {
  homeService.recommend(
    (results) => onSuccess(res, QUERY_OK, results),
    () => onFail(res, QUERY_FAILED)
  )
})

// 免费阅读
app.get('/book/home/freeRead/v2', (req, res) => {
  homeService.freeRead(
    (results) => onSuccess(res, QUERY_OK, results),
    () => onFail(res, QUERY_FAILED)
  )
})

// 热门阅读
app.get('/book/home/hotBook/v2', (req, res) => {
  homeService.hotBook(
    (results) => onSuccess(res, QUERY_OK, results),
    () => onFail(res, QUERY_FAILED)
  )
})

// 热搜
app.get('/book/hot-search', (req, res) => {
  searchService.hotSearch(
    (results) => onSuccess(res, QUERY_OK, results),
    () => onFail(res, QUERY_FAILED)
  )
})

// 图书详情
app.get('/book/detail', (req, res) => {
  const conn = connect()
  const fileName = req.query.fileName
  const openId = req.query.openId
  const sql = `select * from book where fileName='${fileName}'`
  conn.query(sql, (err, results) => {
    if (err) {
      res.json({
        error_code: 1,
        msg: QUERY_FAILED
      })
    } else {
      if (results && results.length === 0) {
        res.json({
          error_code: 1,
          msg: QUERY_FAILED
        })
      } else {
        const book = results[0]
        book['cover'] = `${resUrl}/img/${book.cover}`
        book['selected'] = false
        book['private'] = false
        book['cache'] = false
        book['haveRead'] = 0
        book['opf'] = `${fileUrl2}/${book.fileName}/${book.rootFile}`
        if (openId && openId.length > 0) {
          searchService.saveHotBook({
            fileName: book.fileName,
            title: book.title,
            openId
          })
        }
        bookService.getBookDetailReader(fileName, openId,
          (results) => {
            book.readers = results[0]
            book.readerNum = results[1][0].count
            book.rank = (results[2] && results[2].length > 0 && results[2][0].rank) || 0
            book.rankNum = results[3][0].count || 0
            book.rankAvg = results[3][0].rank || 0
            res.json({
              error_code: 0,
              msg: QUERY_OK,
              data: book
            })
          },
          () => {
            res.json({
              error_code: 1,
              msg: QUERY_FAILED,
              data: book
            })
          })
      }
    }
    conn.end()
  })
})

// 图书目录
app.get('/book/contents', (req, res) => {
  const conn = connect()
  const fileName = req.query.fileName || ''
  const sql = `select * from contents where fileName='${fileName}' order by \`order\` asc`
  conn.query(sql, (err, results) => {
    if (err) {
      res.json({
        error_code: 1,
        msg: '电子书信息获取失败'
      })
    } else {
      if (results && results.length === 0) {
        res.json({
          error_code: 1,
          msg: QUERY_FAILED
        })
      } else {
        res.json({
          error_code: 0,
          msg: QUERY_OK,
          data: results
        })
      }
    }
    conn.end()
  })
})

// 加入书架
app.get('/book/shelf/save', (req, res) => {
  let shelf = req.query.shelf
  if (shelf) {
    shelf = decodeURIComponent(shelf)
    shelfService.saveToShelf(
      JSON.parse(shelf),
      () => onSuccess(res, '加入书架成功'),
      () => onFail(res, '加入书架失败')
    )
  } else {
    onFail(res, '加入书架失败')
  }
})

// 获取书架
app.get('/book/shelf/get', (req, res) => {
  const openId = req.query.openId
  const fileName = req.query.fileName

  function wrapperBook(data) {
    return data.map(book => {
      book['cover'] = `${resUrl}/img/${book.cover}`
      return book
    })
  }

  shelfService.getShelfByOpenId(
    { openId, fileName },
    (data) => onSuccess(res, '书架获取成功', wrapperBook(data)),
    () => onFail(res, '书架获取失败')
  )
})

// 移出书架
app.get('/book/shelf/remove', (req, res) => {
  let shelf = req.query.shelf
  if (shelf) {
    shelf = decodeURIComponent(shelf)
    shelfService.removeFromShelf(
      JSON.parse(shelf),
      () => onSuccess(res, '移出书架成功'),
      () => onFail(res, '移出书架失败')
    )
  } else {
    onFail(res, '移出书架失败')
  }
})

// 搜索图书
app.get('/book/search', (req, res) => {
  function onQuerySuccess(results) {
    onSuccess(res, QUERY_OK, results)
    if (openId && openId.trim().length > 0) {
      searchService.saveHotSearch({ keyword, openId })
    }
  }

  let keyword = req.query.keyword
  let page = req.query.page || 1
  let pageSize = req.query.pageSize || 20
  let openId = req.query.openId
  if (keyword && keyword.length > 0) {
    keyword = decodeURIComponent(keyword)
    searchService.search(
      { keyword, page, pageSize },
      onQuerySuccess,
      () => onFail(res, QUERY_FAILED)
    )
  } else {
    onFail(res, QUERY_FAILED)
  }
})

// 搜索图书列表
app.get('/book/search-list', (req, res) => {
  const publisher = req.query.publisher
  const author = req.query.author
  const category = req.query.category
  const categoryId = req.query.categoryId
  let page = req.query.page || 1
  let pageSize = req.query.pageSize || 20
  if (publisher || author || category || categoryId) {
    const params = {}
    publisher && (params.publisher = decodeURIComponent(publisher))
    author && (params.author = decodeURIComponent(author))
    category && (params.category = decodeURIComponent(category))
    categoryId && (params.categoryId = decodeURIComponent(categoryId))
    params.page = page
    params.pageSize = pageSize
    searchService.searchBook(
      params,
      (results) => onSuccess(res, QUERY_OK, results),
      () => onFail(res, QUERY_FAILED)
    )
  } else {
    onFail(res, QUERY_FAILED)
  }
})

// 分类图书列表
app.get('/book/category/list/v2', (req, res) => {
  homeService.allCategory(
    (results) => onSuccess(res, QUERY_OK, results),
    () => onFail(res, QUERY_FAILED)
  )
})

// 图书评分
app.get('/book/rank/save', (req, res) => {
  const openId = req.query.openId
  const fileName = req.query.fileName
  const rank = req.query.rank
  if (!openId) {
    onFail(res, OPEN_ID_NOT_NULL)
  } else {
    bookService.saveBookRank(
      fileName, openId, rank,
      () => onSuccess(res, '保存评分成功'),
      () => onFail(res, '保存评分失败')
    )
  }
})

// 计算用户加入平台时间
app.get('/user/day', (req, res) => {
  const openId = req.query.openId
  if (!openId) {
    onFail(res, OPEN_ID_NOT_NULL)
  } else {
    userService.day(
        openId,
        (results) => onSuccess(res, QUERY_OK, results),
        () => onFail(res, QUERY_FAILED),
    )
  }
})

// 启动http服务
const server = app.listen(4000, function() {
  const host = server.address().address
  const port = server.address().port

  console.log('listening at http://%s:%s', host, port)
})

// 启动https服务
const httpsPrivateKey = './https/xiaoyangmm.top.key' // 替换为自己的密钥
const httpsCertificate = './https/xiaoyangmm.top.pem' // 替换为自己的证书
const https = require('https')
const privateKey = fs.readFileSync(httpsPrivateKey, 'utf8')
const certificate = fs.readFileSync(httpsCertificate, 'utf8')
const credentials = { key: privateKey, cert: certificate }
const httpsServer = https.createServer(credentials, app)
httpsServer.listen(18081, function() {
  console.log('HTTPS Server is running on: https://localhost:%s', 18081)
})

// 异常监听
process.on('uncaughtException', function(err) {
  //打印出错误
  console.log(err)
  //打印出错误的调用栈方便调试
  console.log(err.stack)
})
