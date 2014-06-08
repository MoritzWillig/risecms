
user=require("../../system/models/user.js");

function paramObj(req) {
  return (req.body.user)?req.body:req.query;
}

function authInit(pluginHandler) {
  pluginHandler.registerRoute("plugins","/auth/login",function(req,res,next) {
    var postData=paramObj(req);
    var name=postData.name;
    var pass=postData.password;
    
    var usr=new user(name,function() {
      var status=usr.authenticate(pass);
      
      if (status===true) {
        req.session.user=usr.name;
      } else {
        req.session.user=undefined;
      }

      res.send({
        success:status,
        name:usr.name,
        groups:status?usr.groups:undefined
      });
    });
  });

  pluginHandler.registerRoute("plugins","/auth/logout",function(req,res,next) {
    req.session.user=undefined;
    res.send({
      success:true
    });
  });

  pluginHandler.registerRoute("plugins","/auth/is",function(req,res,next) {
    var is=req.user.isUser();
    res.send({
      isUser:is,
      name:is?req.user.name:undefined,
      groups:is?req.user.groups:undefined
    });
  });
}


module.exports=authInit;