const process = require('child_process');
const escape = require('./lib/escape');

/**
 * Wrapper for Calibre's command line tools.
 */
class Calibre {

  /**
   * Initialize the instance by setting provided options.
   * @param {object} [options]
   * @param {string} [options.library] - Full path to Calibre library. Only
   * needed if the commands this instance will run use the --library-path
   * option.
   * @param {boolean} [options.log=false] - If true, the command string that is
   * run by Node's child_process.exec() is logged to console before running.
   * @param {object} [options.execOptions] - The object passed to Node's
   * child_process.exec() as the options argument.
   * @param {boolean} [options.notifyGUI=false] If false, the 'dont-notify-gui'
   * option is passed to calibredb commands.
   */
  constructor(options = {}) {
    this.execOptions = options.execOptions || { maxBuffer: 2000 * 1024 };
    this.notifyGUI = options.notifyGUI || false;
    this.library = options.library || '';
    this.log = options.log || false;
  }

  /**
   * Runs a command on one of Calibre's binaries.
   * @param {string} command - The name of the bin and command to run. For
   * example 'calibredb add' or 'ebook-convert'.
   * @param {string[]} [args] - An array of argument strings that the
   * command will accept. All arguments are wrapped in "" and escaped.
   * @param {object} [options] - A key:value object containing options that the
   * command will accept. If an option does not take a value, the key's value
   * should be an empty string. All values are wrapped in "" and escaped.
   * @returns {Promise} A promise that is rejected if the callback of Node's
   * child_process.exec() has a value for error or stderr and resolves to the
   * callback's stdout if no error occured.
   */
  run(command = '', args = [], options = {}) {
    let execString = command;

    // Add default options to object if for calibredb
    if (command.indexOf('calibredb') == 0) {
      options = Object.assign({
        'library-path': this.library,
      }, options);

      if (!this.notifyGUI) options['dont-notify-gui'] = null;
    }

    // Build options string from object
    execString += ' ' +
    Object.entries(options).map(option => {
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
    }).join(' ');

    // Build arguments string from array
    execString += ' ' + args.map(arg => `"${escape(arg)}"`).join(' ');

    if (this.log) console.log('~~node-calibre:', execString);

    return new Promise((resolve, reject) => {
      process.exec(execString, this.execOptions, (err, stdout, stderr) => {
        if (err)
          reject(err);
        // Ignore 'Qt: Untested version' warning
        else if (stderr && stderr.indexOf('Qt:') == -1)
          reject(stderr);
        else
          resolve(stdout);
      });
    });
  }

}

module.exports = Calibre;