Expr
  = child:LogicalOr { return child; }
 
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
    return { type: 'TEXT', terms: [child] };
  }
  }

ParenExpr
  = OpenParen expr:Expr CloseParen { return expr; }

Phrase
  = Quote text:PhraseWords Quote { return { type: 'TEXT', terms: text }; }
 
PhraseWords
  = Word+

Word
  = _ String { return text().trim(); }

String
  = !OpAND !OpOR Char+

Char
  = [\-A-Za-z0-9_\*]
  
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
