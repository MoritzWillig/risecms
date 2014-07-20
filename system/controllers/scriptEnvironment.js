stat=require("../../status.js");
config=require("../../config.js");
vm=require("vm");
domain=require("domain");

function ScriptEnvironment() {
}

ScriptEnvironment.prototype.run=function(script,env,callback) {
    if (!env) { env={}; }
    //TODO: make scripts time out (introduced at node v0.11)
    
    var callbackTriggered=false;
    var timerHandle;

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
      }
    }

    var localDomain=domain.create();
    localDomain.on("error",function() {
      scriptCb((new stat.states.items.script.CRASH({
        flow:"async",
        error:e,
        errorStr:e.toString(),
        trace:e.stack
      })).toString());
    });

    env.str=undefined;
    env.module={};
    env.module.callback=scriptCb;
    
    env = {
      require: require,
      console: console,
      exports: exports,
      module: {
        exports: exports
      }
    }

    var context=vm.createContext(env);

    //run script
    try {
      localDomain.run(function() {
        vm.runInNewContext(script.scriptText,env,{
          timeout:1000,
          displayErrors:false,
          filename:"ScriptEnvironment"
        });
      });
    } catch(e) {
      scriptCb((new stat.states.items.script.CRASH({
        flow:"sync",
        error:e,
        errorStr:e.toString(),
        trace:e.stack,
      })).toString());
    }
    
    //check if the script was a sync call
    if (env.str!=undefined) {
      scriptCb(env.str);
    } else {
      //give script time to finish async
      timerHandle=setTimeout(function() {
        scriptCb((new stat.states.items.script.TIMEOUT({flow:"async"})).toString());
      }, 1000);
    }
  };


module.exports=ScriptEnvironment;
