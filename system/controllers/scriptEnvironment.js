var stat=require("../../status.js");
var cg=require("../../config.js");
var vm=require("vm");
var domain=require("domain");
var fsanchor=require("../../fsanchor.js");
var path=require("path");
var glModule=require("module");

/**
 * Includes code and runs it in the current context.
 * Since it is currently impossible to completely sandbox code
 * without outsourcing it to a new processes it is currently run in the main process itself. Some 
 * exception handling is done (especially for sync code). For async functions, the code has to 
 * handle exceptions itself, to prevent the app from crashing.
 */
var ScriptEnvironment=function ScriptEnvironment() {
}

ScriptEnvironment.prototype.run=function(script,args,callback) {
    args=args?args.slice():[];
    
    var callbackTriggered=false;
    var timerHandle;

    function onError() {
      scriptCb((new stat.states.items.script.CRASH({
        flow:"async",
        error:e,
        errorStr:e.toString(),
        trace:e.stack
      })).toString());
    };

    function scriptCb(str) {
      if (timerHandle!=undefined) {
        clearTimeout(timerHandle);
      }

      if (!callbackTriggered) {
        callbackTriggered=true;

        if (typeof str!="string") {
          callback(new stat.states.items.script.INVALID_TYPE({result:str}).toString());
        } else {
          callback(str);
        }
      } else {
        //TODO: for now we are ignoring multiple calls from a script
        //this could maybe logged for debugging
      }
    }

    //setup environment
    //module
    var module={callback:scriptCb};
    args.push(module);
    //require
    args.push(function(name) {
      //scripts paths are relative to risecms root
      if (name.charAt(0)!=='.') { return name; }
      name=fsanchor.resolve(name,"root"); 
      return require(name);
    });
    //__dirname
    args.push(fsanchor.resolve("./","root"));
    
    //run script
    
      //since there is no way to pass an scope to
      //runInThisContext, we set
      
      //localDomain.run(function() {
      var e=script.run(args,{
          timeout:cg.system.request.items.sync_timeout,
          displayErrors:false,
        });
      //});
      
    if (e) {
      scriptCb((new stat.states.items.script.CRASH({
        flow:"sync",
        error:e,
        errorStr:e.toString(),
        trace:e.stack,
      })).toString());
    }
    
    //check if the script was a sync call
    if (module.str!=undefined) {
      scriptCb(module.str);
    } else {
      //give script time to finish async
      timerHandle=setTimeout(function() {
        scriptCb((new stat.states.items.script.TIMEOUT({
          flow:"async"
        })).toString());
      }, cg.system.request.items.async_timeout);
    }
  };

ScriptEnvironment.prototype.getScriptName=function(item) {
  var scriptName=(
    (item.header.name!="")?
      item.header.name:
      (item.header.path)?item.header.path:""
    )
    +"["+item.header.id+"]";
  return scriptName;
}


module.exports=ScriptEnvironment;
