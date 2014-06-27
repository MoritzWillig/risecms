/**
 * finds the next matching parenthesis pair in a string
 * @param  {string} str    string to be searched in
 * @param  {string} open   open parenthesis string
 * @param  {string} close  closing parenthesis string
 * @param  {char} [escape] character to escape opening/closing parenthesis
 * @param  {int} [idx]    index to start the search from
 * @return {int/[int,int]}        array with start and end position of parenthesis,
   * negative integer on error - the returned value is -(x+1) the position the error occured while parsing
 */
function findParenthesis(str,open,close,escape,idx) {
  if (typeof escape=="undefined") { escape=""; }
  if (typeof idx   =="undefined") { idx=0; }


  //find first open parenthesis
  var start=findNEsc(str,open ,idx,escape);
  var stop =findNEsc(str,close,idx,escape);

  //mismatching parenthesis - closing before opening
  if (stop<start) {
    return -(stop+1);
  }

  if (start==-1) {
    return [-1,-1];
  }

  var idx=start;
  var depth=1;

  do {
    //TODO: one indexOf-search could be saved by keeping the value which did not update idx in the last pass
    //TODO: will fail if open & close differ in length
    var fStop =findNEsc(str,close,idx+open.length,escape);
    var fStart=findNEsc(str,open ,idx+open.length,escape);
    
    if ((fStart!=-1) && (fStart<fStop)) {
      depth++;
      idx=fStart;
     } else {
      depth--;
      idx=fStop;
    }
  } while ((depth!=0) && (fStop!=-1));

  //mismatching parenthesis - no matching closing parenthesis
  if (fStop==-1) {
    return -(fStart+1);
  }
  
  return [start,fStop+close.length];
}

/**
 * returns if the character at idx is escaped
 * @param  {string}  str string to use
 * @param  {int}  idx index to check
 * @param  {char}  esc escape character
 * @return {Boolean}     whether or not the character is escaped
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
 * @param  {string} str    string to search in
 * @param  {string} search string to search
 * @param  {int} idx    starting position
 * @param  {char} esc    escape character
 * @return {int}        next appearance of search or -1 if not found
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
 * @param  {string} str    string to be searched in
 * @param  {string} search string to be searched
 * @param  {string/[string]} surr   chars which should not surround the search string
 * @param  {int} idx    index to start from
 * @param  {char} esc    escape character
 * @return {int}        return the found index or -1 if the string was not found
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
  findParenthesis:findParenthesis
}