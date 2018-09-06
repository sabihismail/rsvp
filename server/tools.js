const dateFormat = require('dateformat');

const ALPHANUMERIC_LETTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

String.prototype.replaceAll = function(search, replacement) {
  const target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

module.exports = {
  isValidEmail: (email) => {
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email.toLowerCase());
  },

  log: (msg) => {
    const date = dateFormat(new Date(), '[yyyy-mm-dd - hh:MM:ss TT]');

    console.log(date + ' ' + msg);
  },

  parseVariables: (input, data) => {
    return input.replaceAll('{name}', data.name)
      .replaceAll('{email}', data.email)
      .replaceAll('{id}', data.id)
      .replaceAll('{host}', data.host)
      .replaceAll('{url}', data.url);
  },

  generateRandomString: (n) => {
    let result = '';

    for (let i = 0; i < n; i++) {
      result += ALPHANUMERIC_LETTERS[Math.floor(Math.random() * ALPHANUMERIC_LETTERS.length)];
    }

    return result;
  }
};
