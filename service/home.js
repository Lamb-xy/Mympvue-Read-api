const db = require('../db')
const wrapper = require('./book').wrapperCover

function handleSuccess(results, onSuccess, onFail) {
  if (!results || results.length === 0) {
    onFail && onFail()
    return
  }
  results.map(item => {
    item.cover = wrapper(item.cover)
    return item
  })

  onSuccess && onSuccess(results)
}

function recommend(onSuccess, onFail) {
  const sql = 'select t2.* from (SELECT title, fileName FROM hot_book_order WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM hot_book_order))) LIMIT 3) as t1 left join book as t2 on t1.fileName=t2.fileName'
  db.querySql(sql,
    (results) => handleSuccess(results, onSuccess, onFail),
    onFail)
}

function freeRead(onSuccess, onFail) {
  const sql = 'SELECT * FROM book WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM book))) LIMIT 4'
  db.querySql(sql,
    (results) => handleSuccess(results, onSuccess, onFail),
    onFail)
}

function hotBook(onSuccess, onFail) {
  const sql = 'select t2.* from (SELECT title, fileName FROM `hot_book_order` WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM `hot_book_order`))) LIMIT 4) as t1 left join book as t2 on t1.fileName=t2.fileName'
  db.querySql(sql,
    (results) => handleSuccess(results, onSuccess, onFail),
    onFail)
}

function allCategory(onSuccess, onFail) {
  const sql = 'select t1.cover, t2.* from (' +
    'select t1.cover, t1.category, t1.categoryText, count(1) as `rank` ' +
    'from book as t1 ' +
    'left join book as t2 ' +
    'on t1.category=t2.category and t1.id>=t2.id ' +
    'where t1.category in (select category from category) ' +
    'group by t1.category, t1.fileName ' +
    'order by t1.categoryText ' +
    ') as t1 ' +
    'left join category_limit as t2 ' +
    'on t1.category=t2.category ' +
    'where `rank` < 3;'
  function handleSuccess(results, onSuccess, onFail) {
    const _category = []
    results.forEach(item => {
      const findItem = _category.find(i => i.category === item.category)
      if (!findItem) {
        _category.push(item)
      } else {
        findItem.cover2 = item.cover
      }
    })
    _category.map(item => {
      item.cover = wrapper(item.cover)
      if (item.cover2) {
        item.cover2 = wrapper(item.cover2)
      } else {
        item.cover2 = item.cover
      }
      return item
    })
    onSuccess && onSuccess(_category)
  }
  db.querySql(sql,
    (results) => handleSuccess(results, onSuccess, onFail),
    onFail)
}

function home(openId, onSuccess, onFail) {
  if (!openId) {
    onFail && onFail()
  } else {
    const sql = [
      `select * from hot_search_order limit 1`, // 搜索热门搜索
      `select t2.* from (SELECT fileName FROM ( select @rownum := @rownum +1 AS id, shelf.* from (SELECT @rownum := 0) as t1, shelf where openId='${openId}') as t1 WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM (select @rownum := @rownum +1 AS id, shelf.* from (SELECT @rownum := 0) as t1, shelf where openId='${openId}') as t1))) LIMIT 3) as t1 left join book as t2 on t1.fileName=t2.fileName`, // 个人书架随机3本书
      `select t2.* 
from (SELECT title, fileName FROM hot_book_order WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM hot_book_order))) LIMIT 6) as t1 left join book as t2 on t1.fileName=t2.fileName`, // 推荐6本书（防止个人书架为空）
      `SELECT * FROM book WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM book))) LIMIT 4`, // 免费阅读4本书
      'select t2.* from (SELECT title, fileName FROM `hot_book_order` WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM `hot_book_order`))) LIMIT 4) as t1 left join book as t2 on t1.fileName=t2.fileName', // 当前最热4本书
      'select t1.cover, t2.* from (' +
      'select t1.cover, t1.category, t1.categoryText, count(1) as `rank` ' +
      'from book as t1 ' +
      'left join book as t2 ' +
      'on t1.category=t2.category and t1.id>=t2.id ' +
      'where t1.category in (select category from category_limit) ' +
      'group by t1.category, t1.fileName ' +
      'order by t1.categoryText ' +
      ') as t1 ' +
      'left join category_limit as t2 ' +
      'on t1.category=t2.category ' +
      'where `rank` < 3;', // 6个分类及封面图片
      `select count(*) as count from shelf where openId='${openId}'` // 书架图书统计
    ]

    function handleSuccess(results) {
      const data = {}
      if (!results || results.length === 0) {
        onFail && onFail()
        return
      }
      const hotSearch = results[0]
      const shelf = results[1]
      const recommend = results[2]
      const freeRead = results[3]
      const hotBook = results[4]
      const category = results[5]
      const shelfCount = results[6]

      hotSearch && (data.hotSearch = hotSearch[0])
      if (shelf && shelf.length === 3) {
        data.shelf = shelf
      } else {
        recommend && (data.shelf = recommend.slice(3, 6))
      }
      recommend && (data.recommend = recommend.slice(0, 3))
      freeRead && (data.freeRead = freeRead)
      hotBook && (data.hotBook = hotBook)

      const _category = []
      category && category.forEach(item => {
        const findItem = _category.find(i => i.category === item.category)
        if (!findItem) {
          _category.push(item)
        } else {
          findItem.cover2 = item.cover
        }
      })
      data.category = _category
      data.banner = {
        img: 'https://www.youbaobao.xyz/book/res/bg.jpg',
        title: 'mpvue2.0多端小程序课程重磅上线',
        subTitle: '马上学习',
        url: 'https://www.youbaobao.xyz/book/#/book-store/shelf'
      }

      data.category.map(item => {
            item.cover = wrapper(item.cover)
            if (item.cover2) {
              item.cover2 = wrapper(item.cover2)
            } else {
              item.cover2 = item.cover
            }
            return item
          })
      data.recommend.map(item => {
        item.cover = wrapper(item.cover)
        return item
      })
      data.freeRead.map(item => {
        item.cover = wrapper(item.cover)
        return item
      })
      data.hotBook.map(item => {
        item.cover = wrapper(item.cover)
        return item
      })
      data.shelf.map(item => {
        item.cover = wrapper(item.cover)
        return item
      })

      data.shelfCount = (shelfCount && shelfCount.length > 0 && shelfCount[0].count) || 0

      onSuccess && onSuccess(data)
    }

    db.querySqlList(sql, handleSuccess, onFail)
  }
}

module.exports = {
  home,
  recommend,
  freeRead,
  hotBook,
  allCategory
}
