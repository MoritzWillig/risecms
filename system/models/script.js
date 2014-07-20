stat=require("../../status.js");
fs=require("fs");
vm=require("vm");

/**
 * the script class stores scripts for later use
 *
 * on syncronous execution "str" has to be set otherwise module.callback has to be used
 */

Script=function() {
};

Script.prototype.loadFile=function(file) {
  try {
    var file=file.replace(/"/g,"\\\""); //escape path to js-string
    this.scriptText=fs.readFileSync(file);
    this.script=vm.createScript(this.scriptText, 'script');

    return null;
  } catch(e) {
    return e;
  }
};

Script.prototype.loadText=function(scriptCode,callback) {
  try {
    this.scriptText=scriptCode;
    this.script=vm.createScript(this.scriptText, 'script');

    return null;
  } catch(e) {
    return e;
  }
};

module.exports=Script;