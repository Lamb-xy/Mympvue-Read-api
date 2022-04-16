function previousDate(now) {
  return new Date(now.getTime() - (3600 * 24 * 1000))
}

function nextDate(now) {
  return new Date(now.getTime() + (3600 * 24 * 1000))
}

/**
 * 判断两个日期是否为同一天
 *
 * @param date1
 * @param date2
 * @returns {*|boolean}
 */
function isSameDay(date1, date2) {
  return date1 && date2 &&
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDay() === date2.getDay()
}

module.exports = {
  isSameDay,
  nextDate,
  previousDate
}
