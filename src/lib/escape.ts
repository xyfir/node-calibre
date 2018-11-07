/**
 * Escapes a string that will be wrapped in double quotes and passed to a
 *  command executed by `child_process.exec()`. Only `\` and `"` characters
 *  are escaped.
 */
export function escape(input: any): string {
  return String(input)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}
