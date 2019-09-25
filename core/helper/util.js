const fs = require('fs'),
      path = require('path');


function getFile(item, filePath, cb) {
  try {
    if(item) {
      filePath += `/${item}`;
    }

    filePath = path.normalize(filePath);

    let fileItem = fs.statSync(filePath);

    if (fileItem.isFile()) {
      cb(filePath);
      return;
    }

    let readItem = fs.readdirSync(filePath);
    for(let item of readItem) {
      getFile(item, filePath, cb);
    }
  } catch(error) {
    console.log(`Erro ao obter arquivo: ${error}`);
    cb(null);
  }
}

function generateDateTimer(date) {
  return `${generateDate(date)}-${generateTimer(date)}`;
}

function generateDate(date) {
  let month = date.getMonth() + 1,
      day = date.getDate(),
      year = date.getFullYear();
      
  month = shouldTwoDigit(month);
  day = shouldTwoDigit(day);

  return `${day}_${month}_${year}`;
}

function generateTimer(date) {
  let hour = date.getHours(),
      min = date.getMinutes(),
      sec = date.getSeconds();
      
  hour = shouldTwoDigit(hour);
  min = shouldTwoDigit(min);
  sec = shouldTwoDigit(sec);

  return `${hour}_${min}_${sec}`;
}

function shouldTwoDigit(value) {
  return value < 10 ? `0${value}` : value;
}

module.exports = {getFile, generateDateTimer, generateDate, generateTimer};
