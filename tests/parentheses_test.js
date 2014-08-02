fp=require("../system/helpers/parentheses.js").findParentheses;

function cl(exp,res) {
  if ((exp[0]!=res[0]) || (exp[1]!=res[1])) {
    console.log("Failed:",exp,res);
  } else {
    console.log("OK",res);
  }
}


function test() {
  //              1234 6789 1234 6789 123
  cl([-1,-1],fp(" aasd ffff ffda sfds fad","{{","}}","\\",0)); //no match
  cl([ 2, 9],fp(" a{{f a}}s adsf ffaf asd","{{","}}","\\",0)); //simple match
  cl([ 2, 9],fp(" a{{f a}}d s{{d f}}d fad","{{","}}","\\",0)); //find matching brackets

  //              1234 6789 1234 6789 123
  cl([ 2,-1],fp(" a{{d ffff ffda sfds fad","{{","}}","\\",0)); //detect missing end
  cl([-1, 9],fp(" asdf a}}s adsf ffaf asd","{{","}}","\\",0)); //detect missing start

  //              1234 6789 1234 6789 123
  cl([ 1,20],fp(" {{{{ asdd ssdd }}}} fad","{{","}}","\\",0)); //nested (written together)
  cl([ 2,19],fp(" a{{f a{{d s}}d f}}d fad","{{","}}","\\",0)); //nested (written separate)
  cl([ 2,19],fp(" a{{f {{{{ }}}} f}}d fad","{{","}}","\\",0)); //nested 3 layers

  //              1234 6789 1234 6789 123
  cl([ 2,-1],fp(" a{{f a{{d sssd f}}d fad","{{","}}","\\",0)); //nested no closing outer bracket
  cl([ 2,14],fp(" a{{f assd s}}d f}}d fad","{{","}}","\\",0)); //nested (ignoring wrong closing)

  //              1234 6789 1234 6789 123
  cl([ 7, 4],fp(" a}}f a{{d sssd fssd fad","{{","}}","\\",0)); //wrong bracket order
  
  //              1234 6 789 1234  6789 12
  cl([-1,-1],fp(" ddsf \\{{ sssd \\}} fad","{{","}}","\\",0)); //escaping brackets
  cl([ 2,21],fp(" a{{f \\{{ sssd \\}} }}d","{{","}}","\\",0)); //escaping inner brackets
  
  //              1234 6 789 1234 6789 12
  cl([ 2,19],fp(" a{{f \\{{ sssd fa}} fad","{{","}}","\\",0)); //escaping single bracket
  cl([ 2,19],fp(" a{{f \\}} sssd aa}} }}d","{{","}}","\\",0)); //escaping single bracket
  
  //              1234 6 7 89 1234 6789 1
  cl([ 2,10],fp(" a{{f \\\\}}sssd aa}} }}","{{","}}","\\",0)); //escaping escape char
}

test();