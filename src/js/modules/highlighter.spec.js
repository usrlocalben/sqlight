import assert from 'assert';
import highlighter from './highlighter.js';
import queryParser from './query-grammar.pegjs';

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


describe('findMatchingSpans', () => {
  it('correctly matches an expr if it\'s at the end of a string', () => {
    const qExpr = queryParser.parse('"foo bar" "baz"');
    const text = 'This string ends with foo bar.'
    const out = highlighter.findMatchingSpans(text, qExpr);
    const expected = [ { from: 22, until: 29 } ];
    assert.deepEqual(out, expected);
  });

  it('correctly matches an expr with wildcards', () => {
    const qExpr = queryParser.parse('string**foo');
    //            0123456789012345678901234567
    const text = 'This string ends with foo bar.'
    const out = highlighter.findMatchingSpans(text, qExpr);
    const expected = [ { from: 5, until: 25 } ];
    assert.deepEqual(out, expected);
  });
});
