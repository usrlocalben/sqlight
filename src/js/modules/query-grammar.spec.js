import assert from 'assert';
import queryParser from './query-grammar.pegjs';

describe('the query parser', () => {
  it('should parse a single word', () => {
    const out = queryParser.parse('foo');
    const expected = { type: 'TEXT', terms: ['foo'] };
    assert.deepEqual(out, expected);
  });

  it('should parse a multiple words', () => {
    const out = queryParser.parse('foo bar baz');
    const expected = {
      type: 'AND',
      exprs: [
        { type: 'TEXT', terms: ['foo'] },
        { type: 'TEXT', terms: ['bar'] },
        { type: 'TEXT', terms: ['baz'] },
      ],
    };
    assert.deepEqual(out, expected);
  });

  it('should parse a quoted sequence', () => {
    const out = queryParser.parse('"foo bar baz"');
    const expected = { type: 'TEXT', terms: ['foo', 'bar', 'baz'] };
    assert.deepEqual(out, expected);
  });

  it('should parse two adjacent quoted sequences', () => {
    const out = queryParser.parse('"foo bar" "fizz buzz"');
    const expected = {
      type: 'AND',
      exprs: [
        { type: 'TEXT', terms: ['foo', 'bar'] },
        { type: 'TEXT', terms: ['fizz', 'buzz'] },
      ],
    };
    assert.deepEqual(out, expected);
  });

  it('should parse exprs with OR', () => {
    const out = queryParser.parse('"foo bar" OR "fizz buzz"');
    const expected = {
      type: 'OR',
      exprs: [
        { type: 'TEXT', terms: ['foo', 'bar'] },
        { type: 'TEXT', terms: ['fizz', 'buzz'] },
      ],
    };
    assert.deepEqual(out, expected);
  });

  it('should parse exprs in parens', () => {
    const out = queryParser.parse('("foo bar" OR "fizz buzz")');
    const expected = {
      type: 'OR',
      exprs: [
        { type: 'TEXT', terms: ['foo', 'bar'] },
        { type: 'TEXT', terms: ['fizz', 'buzz'] },
      ],
    };
    assert.deepEqual(out, expected);
  });

  it('should allow leading and trailing whitespace', () => {
    const out = queryParser.parse('    foo bar    ');
    const expected = {
      type: 'AND',
      exprs: [
        { type: 'TEXT', terms: ['foo'] },
        { type: 'TEXT', terms: ['bar'] },
      ],
    };
    assert.deepEqual(out, expected);
  });

  it('should convert hyphenated words into sequences', () => {
    const out = queryParser.parse('bread-and-butter');
    const expected = { type: 'TEXT', terms: ['bread', 'and', 'butter'] };
    assert.deepEqual(out, expected);
  });

  it('should ignore no-word-characters attached to words', () => {
    const out = queryParser.parse('vi v. $emacs');
    const expected = {
      type: 'AND',
      exprs: [
        { type: 'TEXT', terms: ['vi'] },
        { type: 'TEXT', terms: ['v'] },
        { type: 'TEXT', terms: ['emacs'] },
      ],
    };
    assert.deepEqual(out, expected);
  });

  it('should handle pasted blobs no one would write', () => {
    const out = queryParser.parse('  Jackson v. Star Sprinkler Corp., 575 F.2d 1223 (8th Cir. 1978).');
    const expected = {
      type: 'AND',
      exprs: [
        { type: 'TEXT', terms: ['Jackson'] },
        { type: 'TEXT', terms: ['v'] },
        { type: 'TEXT', terms: ['Star'] },
        { type: 'TEXT', terms: ['Sprinkler'] },
        { type: 'TEXT', terms: ['Corp'] },
        { type: 'TEXT', terms: ['575'] },
        { type: 'TEXT', terms: ['F'] },
        { type: 'TEXT', terms: ['2d'] },
        { type: 'TEXT', terms: ['1223'] },
        { type: 'AND', exprs: [
          { type: 'TEXT', terms: ['8th'] },
          { type: 'TEXT', terms: ['Cir'] },
          { type: 'TEXT', terms: ['1978'] },
        ] },
      ],
    };
    assert.deepEqual(out, expected);
  });

});
