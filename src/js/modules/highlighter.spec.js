import assert from 'assert';
import highlighter from './highlighter.js';

describe('textSplitSpans', () => {
  it('should split a basic three word string', () => {
    //                                0123456789ab
    const out = highlighter.textSplitSpans('foo bar baz');
    const expected = [
      { from: 0, until: 3, word: 'foo' },
      { from: 4, until: 7, word: 'bar' },
      { from: 8, until: 11, word: 'baz' },
    ];
    assert.deepEqual(out, expected);
  });

  it('should split string with leading/trailing whitespace', () => {
    //                                0123456789abcde
    const out = highlighter.textSplitSpans('      foo bar baz  ');
    const expected = [
      { from: 6, until: 9, word: 'foo' },
      { from: 10, until: 13, word: 'bar' },
      { from: 14, until: 17, word: 'baz' },
    ];
    assert.deepEqual(out, expected);
  });

  it('should split a one word string', () => {
    const out = highlighter.textSplitSpans('baz');
    const expected = [
      { from: 0, until: 3, word: 'baz' },
    ];
    assert.deepEqual(out, expected);
  });
});
