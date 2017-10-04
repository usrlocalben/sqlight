/**
 * google scholar_case query terms highlighter
 *
 * highlight dom manipulation from
 * https://github.com/WindzCUHK/chrome-highlight-extension
 */
import _ from 'lodash';
import queryParser from './query-grammar.pegjs';

const stopWords = 'a an are as at be by for how in is it of on or that the to was what when where who with the'.split(' ');

// query expression tree node types
const NT_OR = 'OR';
const NT_AND = 'AND';
const NT_TEXT = 'TEXT';


/**
 * find all text-containing DOM nodes, but avoid nodes that are
 * not dispaly text, e.g. <script>
 *
 * Returns:
 *   list of dom nodes
 */
const findTextNodes = (element) => {
  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const skipTagName = { NOSCRIPT: true, SCRIPT: true, STYLE: true };
  const textNodes = [];
  while (treeWalker.nextNode()) {
    if (!skipTagName[treeWalker.currentNode.parentNode.tagName]) {
      textNodes.push(treeWalker.currentNode);
    }
  }
  return textNodes;
};


/**
 * evaluate one or more word spans using the query expr tree
 *
 * Returns:
 *   length of match in words, or 0
 */
const evalQuery = (exprNode, wordSpans, wi) => {
  if (exprNode.type === NT_OR || exprNode.type === NT_AND) {
    return _.chain(exprNode.exprs)
            .map((child) => evalQuery(child, wordSpans, wi))
            .max()
            .value();
  } else if (exprNode.type === NT_TEXT) {
    const compareTerm = (textWord, termWord) => {
      if (textWord === null) {
        return false;
      }
      if (termWord === '*') {
        return true;
      }
      return textWord.toLowerCase() === termWord.toLowerCase();
    };
    const numTerms = exprNode.terms.length;
    const clip = wordSpans.slice(wi, wi + numTerms);
    if (clip.length < numTerms) {
      return 0;
    }
    const pairs = _.zip(clip, exprNode.terms);
    const match = _.every(pairs, ([ textWord, termWord ]) => compareTerm(textWord.word, termWord));
    if (!match) {
      return 0;
    }
    if (numTerms === 1 && _.includes(stopWords, exprNode.terms[0].toLowerCase())) {
      return 0;  // don't highlight a lonely stopword
    }
    return numTerms;
  } else {
    throw new Error(`unknown node type "${exprNode.type}"`);
  }
};


/**
 * find regions of text that match the query expr tree
 *
 * Returns:
 *   list of from/until index spans that match
 */
const findMatchingSpans = (text, qExpr) => {
  const spans = [];
  const wordSpans = textSplitSpans(text);

  let glowing = false;
  let segment = [];
  let activeStack = [];
  _.forEach(wordSpans, (wordSpan, wi) => {
    // decrement hit length counters
    activeStack = _.chain(activeStack).map(x => x - 1).filter().value();

    // stop glowing if counter stack is now zero/empty
    if (activeStack.length === 0 && glowing) {
      spans.push({ from: _.first(segment).from, until: _.last(segment).until });
      segment = [];
      glowing = false;
    }

    // test current word against the query
    const hitLengthInWords = evalQuery(qExpr, wordSpans, wi);
    if (hitLengthInWords) {
      if (!glowing && segment.length) {
        segment = [];  // transition to glowing on
      }
      glowing = true;
      activeStack.push(hitLengthInWords);  // start a new match counter
    }
    segment.push(wordSpan);
  });
  if (glowing) {
    // push the last segment if it was a match
    spans.push({ from: _.first(segment).from, until: _.last(segment).until });
  }
  return spans;
};


/**
 * onLoad handler for scholar_case pages
 */
const addHighlights = () => {
  const ruleExistenceDict = {};
  const sheet = (() => {
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);
    return style.sheet;
  })();

  const highlightRange = (range, bgColorCode) => {
    // create wrapping i
    var spanNode = document.createElement('span');
    var selectorName = spanNode.className = 'chrome-extension-sqlight-'.concat(bgColorCode);
    spanNode.classList.add('chrome-extension-sqlight');

    // add highlight class style in CSS
    if (!ruleExistenceDict[bgColorCode]) {
      sheet.insertRule(`.${selectorName} { background: #${bgColorCode} !important; }`, 0);
      ruleExistenceDict[bgColorCode] = true;
    }

    // range.surroundContents() will throw exception if word across multi tag
    spanNode.appendChild(range.extractContents());
    range.insertNode(spanNode);
  };

  const urlParams = new URLSearchParams(location.search);
  const q = urlParams.get('q');
  if (!q) {
    console.log('no query found, nothing to do');
    return;
  }
  console.log(`found query: ${q}`);

  const qExpr = queryParser.parse(q);
  if (qExpr === null) {
    console.log('could not parse query');
    return;
  }

  const textNodes = findTextNodes(document.body);
  textNodes.forEach((node) => {
    // find all spans to highlight
    const highlightSpans = findMatchingSpans(node.textContent, qExpr);

    // convert spans to ranges
    const ranges = [];
    highlightSpans.forEach((range) => {
      var wr = document.createRange();
      wr.setStart(node, range.from);
      wr.setEnd(node, range.until);
      ranges.push(wr);
    });

    // highlight all ranges
    ranges.forEach(range => highlightRange(range, 'ffff00'));
  });
};


/**
 * non-destructive text "split"
 *
 * splits a text string into words, creating a list
 * of from/until index spans in the original text,
 * and the word contained in that region.
 */
const textSplitSpans = (text) => {
  const NWC = ' ,./?<>[]{};:"!@#%^&*()-+=';
  const spans = [];
  let buf = [];
  let on = false;
  let start = 0;
  let end = 0;
  let idx;
  for (idx = 0; idx < text.length; idx += 1) {
    const ch = text[idx];
    const chIsNWC = NWC.indexOf(ch) > -1;
    if (on && chIsNWC) {
      if (buf.length) {
        spans.push({ from: start, until: idx, word: buf.join('') });
      }
      buf = [];
      on = false;
    }
    if (!on && !chIsNWC) {
      buf = [];
      on = true;
      start = idx;
    }
    buf.push(ch);
  }
  if (on && buf.length) {
    spans.push({ from: start, until: idx, word: buf.join('') });
  }
  return spans;
};

export default {
  addHighlights,
  evalQuery,
  findMatchingSpans,
  textSplitSpans,
};
