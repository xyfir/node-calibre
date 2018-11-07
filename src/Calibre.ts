import { exec, ExecOptions } from 'child_process';
import { camelToKebab } from './lib/camel-to-kebab';
import { escape } from './lib/escape';

interface ConstructorOptions {
  /**
   * The object passed to Node's `child_process.exec()` as the options argument
   */
  execOptions?: ExecOptions;
  /**
   * Full path to Calibre library. Only needed if the commands this instance
   *  will run use the `--library-path` option
   */
  library?: string;
  /**
   * If true, the command string that is run by Node's `child_process.exec()`
   *  is logged to console before running
   */
  log?: boolean;
}

/** Wrapper for Calibre's command line tools. */
export class Calibre {
  private execOptions: ExecOptions;
  private library: string;
  private log: boolean;

  constructor(options: ConstructorOptions = {}) {
    this.execOptions = options.execOptions || { maxBuffer: 2000 * 1024 };
    this.library = options.library || '';
    this.log = options.log || false;
  }

  /**
   * Essentially just a Promise-wrapped `child_process.exec()` that gets
   *  passed `this.execOptions`.
   * @param options - Will merge and override instance's `execOptions`
   */
  exec(command: string, options: ExecOptions = {}): Promise<string> {
    return new Promise((resolve, reject) =>
      exec(
        command,
        Object.assign({}, this.execOptions, options),
        (err, stdout, stderr) => {
          if (err) reject(err);
          else if (stderr) reject(stderr);
          else resolve(stdout);
        }
      )
    );
  }

  /**
   * Runs a command on one of Calibre's binaries.
   * @param command - The name of the bin and command to run. For
   *  example `calibredb add` or `ebook-convert`.
   * @param args - An array of arguments that the command will accept.
   *  All arguments are converted to strings, wrapped in "", and escaped.
   * @param options - A key:value object containing options that the
   *  command will accept. If an option does not take a value, the key's value
   *  should be an empty string. All values are wrapped in "" and escaped.
   */
  run(command: string, args: any[] = [], options = {}): Promise<string> {
    // `options` can be second argument
    if (!Array.isArray(args) && typeof args == 'object')
      (options = args), (args = []);

    let execString = command;

    // Add default options to object if for calibredb
    if (command.startsWith('calibredb'))
      options = Object.assign({ libraryPath: this.library }, options);

    // Build options string from object
    execString +=
      ' ' +
      Object.entries(options)
        .map(([key, value]) => {
          key = camelToKebab(key);

          // Support options that can have multiple values
          // `field: ['a','b','c']` -> `--field "a" --field "b" --field "c"`
          return (Array.isArray(value) ? value : [value])
            .map(value => {
              let option = '';

              // Convert 's' to '-s', 'search' to '--search'
              if (key.length == 1) option = `-${key}`;
              else option = `--${key}`;

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
