import * as assert from 'assert';
import { Calibre } from './Calibre';
import { resolve } from 'path';

(async () => {
  const calibre = new Calibre({
    library: '.',
    execOptions: { cwd: resolve(__dirname, '../') }
  });
  let res: string;

  res = await calibre.exec('echo test');
  assert.equal(res.trim(), 'test', 'exec: echo test');

  assert.rejects(
    calibre.exec('echo test', { maxBuffer: 0 }),
    'exec: echo test w/ maxBuffer 0'
  );

  res = await calibre.run('calibredb');
  assert.notEqual(
    res.indexOf(
      'calibredb.exe is the command line interface to the calibre books database'
    ),
    -1,
    'run: calibredb'
  );

  res = await calibre.run('calibredb list', [], { help: null });
  assert.notEqual(
    res.indexOf('List the books available in the calibre database'),
    -1,
    'run: calibredb list --help'
  );

  res = await calibre.run('calibredb list');
  assert.notEqual(res.indexOf('id title authors'), -1, 'run: calibredb list');

  res = await calibre.run('calibredb list', [], { forMachine: null });
  assert.equal(res, '[]', 'run: calibredb list --for-machine');

  try {
    await calibre.run('ebook-convert', ['test.mobi', 'test.epub']);
    assert.equal(
      true,
      false,
      'run: ebook-convert "test.mobi" "test.epub" (should have failed)'
    );
  } catch (err) {
    assert.equal(
      err.toString().trim(),
      'Error: Command failed: ebook-convert  "test.mobi" "test.epub"',
      'run: ebook-convert "test.mobi" "test.epub" (failed command)'
    );
  }

  const newFile = await calibre.ebookConvert('res/pg98.epub', 'txt');
  assert.equal(newFile, 'res/pg98.epub.txt', 'ebookConvert');

  console.log('Tests complete without error');
})();
