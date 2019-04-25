_A simple Node wrapper for Calibre's [command line tools](https://manual.calibre-ebook.com/generated/en/cli-index.html)._

Built and maintained by the [Xyfir Network](https://www.xyfir.com).

node-calibre is mostly a simple wrapper around Calibre's CLI using Node's [child_process.exec()](https://nodejs.org/api/child_process.html), without many extra features added. In the future this package will contain more methods unique to each of Calibre's binaries and with both better error checking and improved results provided on success.

# Examples

```ts
import { Calibre } from 'node-calibre';

// Create Calibre instance
const calibre = new Calibre({ library: '/path/to/calibre/library' });

// Convert ebook from epub to pdf
const newFile = await calibre.ebookConvert('/path/to/book.epub', 'pdf', {
  smartenPunctuation: null
});
console.log(newFile); // "/path/to/book.epub.pdf"

let result: string;

// Add book to Calibre library
result = await calibre.run('calibredb add', ['/path/to/book.epub']);
console.log(result); // "Added book ids: ..."

// List books in Calibre Library
result = await calibre.run('calibredb list', [], { limit: 10 });
console.log(result); // first 10 books

// You can optionally pass `options` as the second parameter
// `forMachine: null` gets converted to `--for-machine`
result = await calibre.run('calibredb list', {
  limit: 10,
  forMachine: null
});
console.log(Array.isArray(JSON.parse(result))); // true
```

# API

## `constructor(options)`

- `options.library`: _string_ - optional, default `''`
  - Full path to the Calibre library to work with.
  - Only needed if the commands this instance will run will use any of the `calibredb` commands.
  - The path will be used as the value for the `--library-path` option for `calibredb` commands.
- `options.log`: _boolean_ - optional, default `false`
  - If true, the command string that is run by Node's child_process.exec() is logged to console before running.
- `options.execOptions`: _object_ - optional, default `{maxBuffer: 2048000}`
  - The object passed to Node's `child_process.exec()` as the options argument.

## `run(command[, args][, options])`

Runs a command on one of Calibre's binaries (calibredb, ebook-convert, etc). Find all [here](https://manual.calibre-ebook.com/generated/en/cli-index.html).

- `command`: _string_
  - The name of the bin and command to run. For example 'calibredb add' or 'ebook-convert'.
- `args`: _any[]_ - optional, default `[]`
  - An array of arguments that the command will accept.
  - All arguments are converted to strings, wrapped in `""`, and escaped.
- `options`: _object_ - optional, default `{}`
  - A key:value object containing options that the command will accept.
  - All values (but not keys) are wrapped in `""` and escaped.
  - If you want to pass on option that doesn't take a value, set the value to null: `{'some-option': null}`.
  - You can also use camelCase keys and they'll be converted to kebab-case: `{forMachine: null}` -> `--for-machine`.
  - If an option can be used multiple times (like `--field` in `calibredb set_metadata`), you can pass an array with all of the values: `{field: ['tags:tag1,tag2', 'title:Some New Title']}` -> `--field "tags:tag1,tag2" --field "title:Some New Title"`.

### Return

A promise that is rejected if the callback of Node's child_process.exec() has a value for error or stderr and resolves to the callback's stdout if no error occurred. Due to how Calibre's command line tools work, most of the time the promise should resolve regardless of whether Calibre encountered an issue. It's up to you to check the resolved result to determine if the command was successful.

## `ebookConvert(input, format, options)`

Wrapper for [ebook-convert](https://manual.calibre-ebook.com/generated/en/ebook-convert.html).

- `input`: _string_
  - Path to the input file to convert.
- `format`: _string_
  - The format (file extension) to convert `input` to.
- `options`: _object_
  - Any CLI options for the `ebook-convert` command.

### Return

Full path to the new file.

## `exec(command[, options])`

This method should only be used if for some reason you need to build your own command string. It's essentially just a Promise-wrapped `child_process.exec()` that gets passed the `execOptions` from the constructor.

- `command`: _string_
  - The full command that you want to run.
  - For example: `calibredb list --for-machine --limit 10`.
- `options`: _object_
  - Will be merged with the `execOptions` object that was passed to the constructor.
  - Properties passed will override properties with the same name from `execOptions`.

### Return

Same as `run()`, which builds a command string and passes it to `exec()`.

# Important Notes

- You should be aware of the `maxBuffer` property of the options object accepted by Node's `child_process.exec()`. It limits the size of output that can be received from a process, in this case one of Calibre's binaries. Unless you set `maxBuffer` as a property in the `execOptions` object, the maximum buffer size will be increased from the default of 200KB to 2MB. The vast majority of commands will get nowhere near this number, however certain commands like `calibredb list` with all fields requested on a large library can get close or even surpass that limit in certain cases. If a command's output exceeds the maxBuffer limit, an error will be thrown.
- User input can be passed as a value in the `args` array and `options` object of `run()`, but _not_ as a command or an option name.
- This package does not install Calibre. You must have Calibre already installed and either have Calibre's bin directory in your system's PATH _or_ use the `cwd` property of `execOptions` (see constructor options) to set Calibre's bin directory.
- Calibre v3 is recommended, but lower versions should also work for the most part.
