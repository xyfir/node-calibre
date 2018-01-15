const process = require('child_process');
const escape = require('./lib/escape');

/**
 * Wrapper for Calibre's command line tools.
 */
class Calibre {

  /**
   * @typedef {object} RunOptions
   * @prop {string} [library] - Full path to Calibre library. Only
   * needed if the commands this instance will run use the --library-path
   * option.
   * @prop {boolean} [log=false] - If true, the command string that is
   * run by Node's child_process.exec() is logged to console before running.
   * @prop {object} [execOptions] - The object passed to Node's
   * child_process.exec() as the options argument.
   */
  /**
   * Initialize the instance by setting provided options.
   * @param {RunOptions} [options]
   */
  constructor(options = {}) {
    this.execOptions = options.execOptions || { maxBuffer: 2000 * 1024 },
    this.library = options.library || '',
    this.log = options.log || false;
  }

  /**
   * Runs a command on one of Calibre's binaries.
   * @param {string} command - The name of the bin and command to run. For
   *  example 'calibredb add' or 'ebook-convert'.
   * @param {any[]} [args] - An array of argument that the command will accept.
   *  All arguments are converted to strings, wrapped in "", and escaped.
   * @param {object} [options] - A key:value object containing options that the
   *  command will accept. If an option does not take a value, the key's value
   *  should be an empty string. All values are wrapped in "" and escaped.
   * @return {Promise.<string>} A promise that is rejected if the callback of Node's
   *  child_process.exec() has a value for error or stderr and resolves to the
   *  callback's stdout if no error occured.
   */
  run(command = '', args = [], options = {}) {
    // `options` can be second argument
    if (!Array.isArray(args) && typeof args == 'object')
      options = args, args = [];

    let execString = command;

    // Add default options to object if for calibredb
    if (command.indexOf('calibredb') == 0) {
      options = Object.assign({
        'library-path': this.library,
      }, options);
    }

    // Build options string from object
    execString += ' ' + Object
      .entries(options)
      .map(option => {
        let str = '';

        // Convert s to -s, search to --search
        if (option[0].length == 1)
          str = '-' + option[0];
        else
          str = '--' + option[0];

        // Add option's value
        if (option[1] != null)
          str += ` "${escape(option[1])}"`;

        return str;
      })
      .join(' ');

    // Build arguments string from array
    execString += ' ' + args.map(arg => `"${escape(arg)}"`).join(' ');

    if (this.log) console.log('~~node-calibre:', execString);

    return new Promise((resolve, reject) =>
      process.exec(execString, this.execOptions, (err, stdout, stderr) => {
        if (err)
          reject(err);
        else if (stderr)
          reject(stderr);
        else
          resolve(stdout);
      })
    );
  }

}

module.exports = Calibre;