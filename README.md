A simple Node wrapper for Calibre's [command line tools](https://manual.calibre-ebook.com/generated/en/cli-index.html).

node-calibre is (for now) a very simple wrapper that is basically a cleaner way of using Calibre's CLI via Node's [child_process.exec()](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback), without many extra features added. In the future this package may contain a more full-featured API with methods unique to each of Calibre's binaries and with both better error checking and improved results provided on success. See the [TODO list](https://github.com/Xyfir/node-calibre/blob/master/TODO.md) for more information.

# Usage Example

```jsx
const Calibre = require('node-calibre');

const calibre = new Calibre({ library: '/path/to/calibre/library' });

calibre
  .run('calibredb add', ['/path/to/book.epub'])
  .then(result => {
    console.log(result); // Added book ids: ...

    return calibre
      .run('ebook-convert', ['path/to/book.epub', 'path/to/book.txt']);
  })
  .then(result => {
    console.log(result); // Output saved to ...

    return calibre
      .run('calibredb list', [], { limit: 10 });
  })
  .then(result => {
    console.log(result); // first 10 books
  })
  .catch(err => {
    console.log(err);
  });
```

# API

## constructor(options)

- `options.library: string` - Optional (default '') - Full path to the Calibre library to work with. Only needed if the commands this instance will run will use any of the `calibredb` commands. The path will be used as the value for the `--library-path` option for `calibredb` commands.
- `options.log: boolean` - Optional (default false) - If true, the command string that is run by Node's child_process.exec() is logged to console before running.
- `options.execOptions: object` - Optional (default {}) - The object passed to Node's child_process.exec() as the options argument.

## run(command[, args[, options]])

Runs a command on one of Calibre's binaries (calibredb, ebook-convert, etc). Find all [here](https://manual.calibre-ebook.com/generated/en/cli-index.html).

- `command: string` - The name of the bin and command to run. For example 'calibredb add' or 'ebook-convert'.
- `args: string[]` - Optional (default []) - An array of argument strings that the command will accept. All arguments are wrapped in "" and escaped.
- `options: object` - Optional (default {}) - A key:value object containing options that the command will accept. If an option does not take a value, the key's value should be an empty string. All values (not keys) are wrapped in "" and escaped. If you want to pass on option that doesn't take a value, set the value to null: `{ 'some-option': null }`.

### Return

A promise that is rejected if the callback of Node's child_process.exec() has a value for error or stderr and resolves to the callback's stdout if no error occurred. Due to how Calibre's command line tools work, most of the time the promise should resolve regardless of whether Calibre encountered an issue. It's up to you to check the resolved result to determine if the command was successful.

# Important Notes

- You should be aware of the `maxBuffer` property of the options object accepted by Node's `child_process.exec()`. It limits the size of output that can be received from a process, in this case one of Calibre's binaries. Unless you set `maxBuffer` as a property in the `execOptions` object, the maximum buffer size will be increased from the default of 200KB to 2MB. The vast majority of commands will get nowhere near this number, however certain commands like `calibredb list` with all fields requested on a large library can get close or even surpass that limit in certain cases. If a command's output exceeds the maxBuffer limit, an error will be thrown.
- User input can be passed as a value in the `args` array and `options` object of `run()`, but *not* as a command or an option name.
- This package does not install Calibre. You must have Calibre already installed and either have Calibre's bin directory in your system's PATH *or* use the `cwd` property of `execOptions` (see constructor options) to set Calibre's bin directory.