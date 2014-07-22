stat=require("../../status.js");
cg=require("../../config.js");
vm=require("vm");
domain=require("domain");
fsanchor=require("../../fsanchor.js");
path=require("path");
glModule=require("module");

function ScriptEnvironment() {
}

ScriptEnvironment.prototype.run=function(script,env,callback,scriptName) {
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

    //setup environment
    env.module={};
    env.module.callback=scriptCb;
    
    var required={};
    var resolveModule=function(module) {
      if (module.charAt(0)!=='.') { return module; }
      return fsanchor.resolve(module,"root"); //scripts paths are relative to risecms root
    };
    var envRequire=function(name) {
      name=resolveModule(name);

      //exchange cache 
      var c=require.cache;
      //require.cache is a pointer to Module._cache, require internally looks up names over the Module._cache
      //reference so we have to replace the cache object there (we are replacing require.cache too, in case 
      //the nodejs code will change)
      require.cache=envRequire.cache;
      glModule._cache=envRequire.cache;

      localDomain.enter();
      var req=require(name);
      localDomain.exit();

      //put normal cache back
      require.cache=c;
      glModule._cache=c;
      
      return req;
    };
    envRequire.cache=required;
    env.require=envRequire;

    env.__dirname=fsanchor.resolve("./","root");
    env.global=env;

    var incl=["console","Buffer","setTimeout","setInterval","clearTimeout","clearInterval","setImmediate","clearImmediate"];
    for (var i in incl) {
      var name=incl[i];
      env[name]=global[name];
    }
    
    //run script
    try {
      localDomain.run(function() {
        vm.runInNewContext(script.scriptText,env,{
          timeout:cg.system.request.items.sync_timeout,
          displayErrors:false,
          filename:"ScriptEnvironment"+(scriptName?":"+scriptName:"")
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
      }, cg.system.request.items.async_timeout);
    }
  };


module.exports=ScriptEnvironment;
