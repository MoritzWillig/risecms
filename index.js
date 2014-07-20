//load configuration
var cg=require('./config.js');
var nitem=require("./system/models/pageitem.js");
var user=require("./system/models/user.js");
var plugins=require("./system/controllers/pluginHandler.js");
var stat=require("./status.js");
var fsanchor=require("./fsanchor.js");

var Item=require("./system/models/item.js");
var ItemInterpreter=require("./system/controllers/itemInterpreter.js");

fsanchor.set("root"   ,"./");
fsanchor.set("storage","./storage/");
fsanchor.set("content","./public/content/");
fsanchor.set("plugins","./plugins/");

var express=require('express');
var express_body=require('body/form');
var cookie_parser=require('cookie-parser');
var express_session=require('express-session');
var redis=require('redis');
var session_redis=require('connect-redis')(express_session);

var app=express();

/**
 * session parsing
 */
app.use(function(req,res,next) {
  express_body(req,function(err,body) {
    //TODO: use body/any + fail on error
    req.body=err?{}:body;
    next();
  });
});

app.use(cookie_parser(cg.session.redis.secret));

app.use(express_session({
  store: new session_redis({
    //client: redis.createClient(),
    host: cg.session.redis.host,
    port: cg.session.redis.port,
    ttl: cg.session.redis.ttl,
    db: cg.session.redis.db,
    pass: cg.session.redis.pass,
    prefix: cg.session.redis.prefix,
  }),
  secret:cg.session.redis.secret,
  rolling:true,
  cookie: {
    maxAge:cg.session.redis.ttl*1000
  }
}));

app.use(function(req,res,next) {
  var session=req.session;
  new user(session.user?session.user:undefined,function(user) {
    req.user=user;
    //console.log(user.status.toString());
    next();
  });
});

/*
 * trigger request event
 */
app.use(function(req,res,next) {
  var evtObj={req:req,res:res};
  plugins.trigger("request.pre",evtObj);
  next();
});

/*
 * content, api & plugin routes
 */
contentRouter=express.Router();
  contentPluginRouter=express.Router();
  contentRouter.use("/plugins",contentPluginRouter); //map plugins under /content/plugins/
contentRouter.use(express.static("public/content")); //map default content dir
app.use("/content",contentRouter);


apiRouter=express.Router();
app.use("/api",apiRouter);

pluginRouter=express.Router();
app.use("/plugins",pluginRouter);


plugins.setup(app,{
  content:contentPluginRouter,
  api:apiRouter,
  plugins:pluginRouter
});


/*
 * CMS routing
 */
app.use('/', function(req, res) {
  var global={
    host:"http://"+cg.http.host+((cg.http.port==80)?"":(":"+cg.http.port)),
    title:"Test",
    req:req,
    res:res
  };

  var evtObj={req:req,res:res,global:global};
  plugins.trigger("page.pre",evtObj);

  /*nitem.loadByPath(req.url,function(page,error) {
    //if is object parse with parent or display error
    if (stat.isSuccessfull(error)) {
      console.log(page.data);
      if (page.data.header.type=="data") {
        page.item=JSON.stringify(page.item);
      }
    }


    var httpRes=stat.toHTTP(page.item,error);

    var evtObj={req:req,res:res,httpRes:httpRes,global:global};
    plugins.trigger("page.post",evtObj);
    res.send(evtObj.httpRes.code,evtObj.httpRes.data);
  },{
    global:global
  });*/
  
  var pageItem=ItemInterpreter.create(req.url,true,function(item) {
    if (item.isValid()) {
      //TODO: add page.preCompose
      
      ItemInterpreter.compose(item,function(final) {
        pagePost(200,final);
      },undefined,undefined,global);
    } else {
      if (item.hasHeaderErr()) {
        pagePost(404,"Error - "+item.statusHeader.toString());
      } else {
        pagePost(404,"Error - "+item.statusFile.toString());
      }
    }

    function pagePost(code,pageStr) {
      var evtObj={code:code,item:pageItem,page:pageStr,global:global};
      //TODO: insert page.post
      //plugins.trigger("page.post",evtObj);

      res.send(evtObj.code,evtObj.page);
    }
        
  },global);
});

app.use(function(err,req,res) {
  console.error(err.stack);
  res.send(500,"Server error");
});

var server = app.listen(cg.http.port, cg.http.host, function() {
  console.log('Listening on port %d', server.address().port);
});

(function registerEvents() {
  /**
   * @event page.pre
   * @param {Request} req http request
   * @param {Response} res http response
   * @param {Object} global global param object
   */
  plugins.registerEvent("page.pre");
  /**
   * @event page.post
   * @param {Request} req http request
   * @param {Response} res http response
   * @param {HttpRes} httpRes result to be send
   * @param {Object} global global param object
   */
  plugins.registerEvent("page.post");
  /**
   * @event request.pre
   * @param {Request} req http request
   * @param {Response} res http response
   */
  plugins.registerEvent("request.pre");
})();

for (var i in cg.system.plugins) {
  console.log("loading plugin",cg.system.plugins[i]);
  var path=fsanchor.resolve(cg.system.plugins[i],"plugins");

  plugins.registerPlugin(cg.system.plugins[i],path);
}