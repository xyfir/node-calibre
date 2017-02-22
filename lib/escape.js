/**
 * Escapes a string that will be wrapped in double quotes and passed to a
 * command executed by child_process.exec(). Only \ and " characters are
 * escaped.
 * @param {any} input - The input to escape. Will be converted to a string.
 * @returns {string} An escaped version of input.
 */
module.exports = function(input) {

  return String(input).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

};