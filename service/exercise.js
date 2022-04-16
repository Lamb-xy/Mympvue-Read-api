const db = require('../db')

/**
 * 获取该课程下所有习题组列表
 *
 * @param cid
 * @param onSuccess
 * @param onFail
 */
function getExerciseSet(cid, onSuccess, onFail) {
  const sql = `select * from ex_exercise_set where cid='${cid}' order by create_dt asc`
  db.querySql(sql, onSuccess, onFail)
}

/**
 * 获取某一习题组下的所有章节及该章节下的所有习题数量
 *
 * @param cid
 * @param exSetId
 * @param onSuccess
 * @param onFail
 */
function getChapter(cid, exSetId, onSuccess, onFail) {
  const sql = 'select t1.id, t1.`name`, t1.pid, t1.`order`, t1.level, t2.num, t2.finish_time, t2.ex_set_id ' +
    'from ex_chapter as t1 ' +
    'left join ( ' +
    'select count(*) as num, sum(finish_time) as finish_time, ex_set_id, chapter_id ' +
    'from ex_exercise ' +
    'where ex_set_id=\'' + exSetId + '\'' +
    'group by chapter_id ' +
    ') as t2 on t1.id=t2.chapter_id ' +
    'where t1.cid=\'' + cid + '\' ' +
    'order by t1.`order` asc'
  db.querySql(sql, onSuccess, onFail)
}

function getExercise({ cid, exSetId, chapterId }, onSuccess, onFail) {
  const sql = `select \`name\`, type, answer, answer_a, answer_b, answer_c, answer_d, body, body_url, \`order\`, remark, score from ex_exercise where ex_set_id=${exSetId} and cid=${cid} and chapter_id=${chapterId}`
  db.querySql(sql, onSuccess, onFail)
}

module.exports = {
  getExerciseSet,
  getChapter,
  getExercise
}
