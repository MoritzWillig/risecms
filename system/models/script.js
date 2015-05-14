var stat=require("../../status.js");
var fs=require("fs");
var vm=require("vm");

var Script=function Script() {
};

Script.prototype.loadFile=function(file,args,filename) {
  //var file=file.replace(/"/g,"\\\""); //escape path to js-string
  var scriptCode=fs.readFileSync(file);
  
  return this.loadText(scriptCode,args,filename);
};

//choose a name which can be set in global scope and is not used by any other code!
Script.prototype._globalArgsName="__$script_args$__";

Script.prototype.loadText=function(scriptCode,args,filename) {

  if (!filename) { filename=""; }
  this.args=args.slice();
  
  var argsStr=this.args.join(",");
  var code=
    this._globalArgsName+"=function "+this._globalArgsName+"("+argsStr+") {"+
    scriptCode+
    "\n}";

  try {  
    this.script=new vm.Script(code, {
      displayErrors:false,
      filename:filename
    });

    return null;
  } catch(e) {
    return e;
  }
};

/**
 * runns the script in this context with the given arguments set in the current scope
 * @param {array} args   arguments array to be passed to the script
 * @param {object} options options from Script.runInThisContext(options)
 */
Script.prototype.run=function run(args,options) {
  try {
    this.script.runInThisContext(options);
    global[this._globalArgsName].apply(undefined,args);
    delete global[this._globalArgsName];
  } catch(e) {
    return e;
  }
}

module.exports=Script;