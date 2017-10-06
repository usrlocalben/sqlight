Expr
  = child:LogicalOr NWC  { return child; }
 
LogicalOr
  = child:(OrExpr / LogicalAnd) { return child; }

LogicalAnd
  = child:(AndExpr / TermList) { return child; }

OrExpr
  = left:LogicalAnd OpOR right:LogicalOr { return { type: 'OR', exprs: [ left, right ] }; }

AndExpr
  = left:Term OpAND right:LogicalAnd { return { type: 'AND', exprs: [ left, right ] }; }

TermList
  = child:Term+ {
    if (child.length > 1) {
      return { type: 'AND', exprs: child };
    } else {
      return child[0];
    }
  }
 
Term
  = child:(ParenExpr / Phrase / Word) {
  if (child.type !== undefined) {
    return child;
  } else {
    if (child.indexOf('*') > -1) {
      var words = child.split('*');
      var out = [];
      words.forEach(function (word) {
        if (word.length) {
          out.push(word);
        }
        out.push('*');
      });
      out = out.slice(0, out.length - 1);
      return { type: 'TEXT', terms: out };
    } else {
      const maybeHyphenSeq = child.split('-');
      return { type: 'TEXT', terms: maybeHyphenSeq };
    }
  }
  }

ParenExpr
  = OpenParen expr:Expr CloseParen { return expr; }

Phrase
  = Quote text:PhraseWords Quote { return { type: 'TEXT', terms: text }; }
 
PhraseWords
  = Word+

Word
  = _ [\.\$\,]* word:String [\.\$\,]* { return word; }

String
  = !OpAND !OpOR chars:Char+ { return chars.join(''); }

Char
  = [\-A-Za-z0-9_\*]

NWC
  = [ \t\n\r\.\$\,]*
  
OpenParen
  = _ "("

CloseParen
  = _ ")"
  
Quote
  = _ "\""
        
OpOR "OR"
  = _ "OR"

OpAND "AND"
  = _ "AND"

_ "whitespace"
  = [ \t\n\r]*
