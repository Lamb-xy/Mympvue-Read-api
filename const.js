const env = require('./env').env

let resUrl = ''
let fileUrl = ''
let fileUrl2 = ''
let mp3FilePath = ''
let epubFilePath = ''
let epub2FilePath = ''
let epubCoverPath = ''
let rootFilePath = ''

if (env === 'dev') {
  resUrl = 'http://localhost:8082/book/res'
  fileUrl = 'http://localhost:8082/epub'
  mp3FilePath = '/Users/apple/nginx/upload/export/book/res/mp3'
  epubFilePath = '/Users/apple/nginx/upload/export/epub'
  epubCoverPath = '/Users/apple/nginx/upload/export/book/res/img'
} else if (env === 'dev-home') {
  // resUrl = 'http://192.168.31.148:8081/book/res'
  // fileUrl = 'http://192.168.31.148:8081/epub'
  resUrl = 'https://www.youbaobao.xyz/book/res'
  fileUrl = 'https://www.youbaobao.xyz/epub'
  fileUrl2 = 'https://www.youbaobao.xyz/epub2'
  mp3FilePath = '/Users/sam/upload/book/res/mp3'
  epubFilePath = '/Users/sam/upload/epub'
  epub2FilePath = '/Users/sam/upload/epub2'
  epubCoverPath = '/Users/sam/upload/book/res/img'
  rootFilePath = '/Users/sam'
} else if (env === 'prod') {
  resUrl = 'https://www.youbaobao.xyz/book/res'
  fileUrl = 'https://www.youbaobao.xyz/epub'
  fileUrl2 = 'https://www.youbaobao.xyz/epub2'
  mp3FilePath = '/root/upload/book/res/mp3'
  epubFilePath = '/root/upload/book/epub'
  epub2FilePath = '/root/upload/book/epub2'
  rootFilePath = '/root'
}

module.exports = {
  resUrl: resUrl,
  fileUrl: fileUrl,
  fileUrl2: fileUrl2,
  mp3FilePath: mp3FilePath,
  epubFilePath: epubFilePath,
  epub2FilePath: epub2FilePath,
  epubCoverPath: epubCoverPath,
  rootFilePath: rootFilePath
}
