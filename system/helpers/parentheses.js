/**
* finds the next matching parentheses pair in a string
* @param {string} str string to be searched in
* @param {string} open open parentheses string
* @param {string} close closing parentheses string
* @param {char} [escape] character to escape opening/closing parentheses
* @param {int} [idx] index to start the search from
* @return {[int,int]} array with start and end position of parentheses, -1 if not found
*/
function findParentheses(str,open,close,escape,idx) {
  if (typeof escape=="undefined") { escape=""; }
  if (typeof idx =="undefined") { idx=0; }
  
  //find first open parentheses
  var start=findNEsc(str,open ,idx,escape);
  var stop =findNEsc(str,close,idx,escape);
  var nStart=start; //save starting bracket
  
  function rt() {
    if (stop!=-1) { stop+=close.length; }
    if ((start==-1) || (start>stop)) { start=nStart; }
    return [start,stop];
  }
  
  //mismatching parentheses - closing before opening / no opening
  if ((stop<start) || (start==-1)) {
    return rt();
  }
  
  var idx=start;
  var depth=1;
  
  do {
    //TODO: one indexOf-search could be saved by keeping the value which did not update idx in the last pass
    //TODO: will fail if open & close differ in length
    var stop =findNEsc(str,close,idx+open.length,escape);
    var start=findNEsc(str,open ,idx+open.length,escape);
    
    //no closing brackets were found, open layers can not be closed any more
    if (stop==-1) { break; }
    
    if ((start==-1) || (stop<start)) {
      //if there is no opening bracket or the layer is closed before another one is opened add a new layer
      depth--;
      idx=stop;
    } else {
      //use opening bracket and proceed
      depth++;
      idx=start;
    }
  } while (depth!=0);
  
  return rt();
}

/**
* returns if the character at idx is escaped
* @param {string} str string to use
* @param {int} idx index to check
* @param {char} esc escape character
* @return {Boolean} whether or not the character is escaped
*/
function isEscaped(str,idx,esc) {
  //check if the escape character was escaped ...
  idx--;
  var sidx=idx; //save starting point
  while ((sidx>=0) && (str[sidx]==esc)) { sidx--; }
  var diff=idx-sidx;

  //an odd amount of escape characters means one is left active
  return (diff%2==1);
}

/**
* finds an not escaped string
* @param {string} str string to search in
* @param {string} search string to search
* @param {int} idx starting position
* @param {char} esc escape character
* @return {int} next appearance of search or -1 if not found
*/
function findNEsc(str,search,idx,esc) {
  var next=idx;
  do {
    idx=str.indexOf(search,next);
    if (idx==-1) { break; }

    if (isEscaped(str,idx,esc)) {
      next=idx+esc.length;
    }
  } while (idx<next);

  return idx;
}

/**
* searches for a string, which is not surrounded by given chars
* @param {string} str string to be searched in
* @param {string} search string to be searched
* @param {string/[string]} surr chars which should not surround the search string
* @param {int} idx index to start from
* @param {char} esc escape character
* @return {int} return the found index or -1 if the string was not found
*/
function findNSurr(str,search,surr,idx,esc) {
  if (typeof idx=="undefined") { idx=0; }
  if (typeof esc=="undefined") { esc=""; }

  var surrA;
  if (typeof surrA!="object") {
    surrA=[surr];
  } else {
    surrA=surr;
  }
  
  var open="";
  var searchIdx=0;
  for (;idx<=str.length-search.length; idx++) {
    var c=str[idx];

    if (open=="") {
      //check if surrunding char was found
      if ((escA.indexOf(c)!=-1) && (!isEscaped(str,idx,esc))) {
        open=true;
      } else {
        //check if search is beeing found
        if (c==search[searchIdx]) {
          searchIdx++;
          if (searchIdx==search.length) {
            //string was found - return
            return idx-searchIdx;
          }
        } else {
          //if search string does not match reset search
          searchIdx=0;
        }
      }
    } else {
      //search for closing char & ignore everthing else
      if ((c==open) && (!isEscaped(str,idx,esc))) {
        open=false;
      }
    }
  }
  return -1;
}

module.exports={
  isEscaped:isEscaped,
  findNEsc:findNEsc,
  findParentheses:findParentheses,
  findNSurr:findNSurr
}