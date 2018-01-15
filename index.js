const camelToKebab = require('./lib/camel-to-kebab');
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
   * Essentially just a Promise-wrapped `child_process.exec()` that gets
   *  passed `this.execOptions`.
   * @async
   * @param {string} command
   * @param {object} [options] - Will be merged with `this.execOptions`.
   *  Properties will override properties with the same name in
   *  `this.execOptions`.
   * @return {Promise.<string>} A promise that is rejected if the callback of Node's
   *  child_process.exec() has a value for error or stderr and resolves to the
   *  callback's stdout if no error occured.
   */
  exec(command, options = {}) {
    return new Promise((resolve, reject) =>
      process.exec(
        command,
        Object.assign({}, this.execOptions, options),
        (err, stdout, stderr) => {
          if (err)
            reject(err);
          else if (stderr)
            reject(stderr);
          else
            resolve(stdout);
        }
      )
    );
  }

  /**
   * Runs a command on one of Calibre's binaries.
   * @async
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
    if (command.indexOf('calibredb') == 0)
      options = Object.assign({libraryPath: this.library}, options);

    // Build options string from object
    execString += ' ' + Object
      .entries(options)
      .map(([key, value]) => {
        key = camelToKebab(key);

        // Support options that can have multiple values
        // `field: ['a','b','c']` -> `--field "a" --field "b" --field "c"`
        return (Array.isArray(value) ? value : [value])
          .map(value => {
            let option = '';

            // Convert 's' to '-s', 'search' to '--search'
            if (key.length == 1)
              option = `-${key}`;
            else
              option = `--${key}`;

            // Add option's value
            if (value !== null) option += ` "${escape(value)}"`;

            return option;
          })
          .join(' ');
      })
      .join(' ');

    // Build arguments string from array
    execString += ' ' + args.map(arg => `"${escape(arg)}"`).join(' ');

    if (this.log) console.log('~~node-calibre:', execString);

    return this.exec(execString);
  }

}

module.exports = Calibre;