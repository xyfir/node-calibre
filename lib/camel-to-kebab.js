/**
 * @param {string} string
 * @return {string}
 * @example camelToKebab('someStringExample') // 'some-string-example'
 */
module.exports = function(string) {

  return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

};