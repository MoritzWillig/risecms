EventChain=require("./eventChain.js");
stat=require("../../status.js");

/**
 * the script class stores scripts for later use
 * in both cases (load from file or text) the code has to export a
 * function to the "module.exports" variable which will then be called with
 * the script object itself to register event handlers
 *
 * list of event handlers to register
 * load: (Script,callback) do initial setup which is neccessary for later use (called once on (re)loading the script)
 * compose: (Script, Item,callback) is called on every composition of an item holding this script
 *
 * callbacks given to the events have to be called. The callback signature is (data,undefined/Status)
 */

Script=function() {
  this.setEvenParent(this);
}

Script.prototype=new EventChain(["load","compose"]);

Script.prototype.loadFile(file,callback) {
  try {
    require(file)(this);
    this.trigger("load",[this,callback]);
  } catch(e) {
    callback(undefined,new stat.states.items.SCRIPT_CRASH({event:"load",error:e}));
  }
}

Script.prototype.loadText(scriptCode,callback) {
  try {
    var module={}; //setup variables to be accessed by the script
    eval(scriptCode); //eval script
    module.exports(this); //run actual code

    this.trigger("load",[this,callback]);
  } catch(e) {
    callback(undefined,new stat.states.items.SCRIPT_CRASH({event:"load",error:e}));
  }
}

Script.prototype.run=function(item,callback) {
  try {
    this.trigger("compose",[this,item,callback]);
  } catch(e) {
    callback(undefined,new stat.states.items.SCRIPT_CRASH({event:"compose",error:e}));
  }
}