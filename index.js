//load configuration
var cg=require('./config.js');
var item=require("./system/models/pageitem.js");
var plugins=require("./system/controllers/pluginHandler.js");
var stat=require("./status.js");
var fsanchor=require("./fsanchor.js");
fsanchor.set("storage","./storage/");
fsanchor.set("plugins","./plugins/");

var express=require('express');

var app=express();

app.use("/content",express.static("public/content"));

app.all('/*', function(req, res) {
  item.loadByPath(req.url,function(page,error) {
    var httpRes=stat.toHTTP(page,error);
    res.send(httpRes.code,httpRes.data);
  },{
    global:{
      host:"http://"+cg.http.host+((cg.http.port==80)?"":(":"+cg.http.port)),
      title:"Test"
    }
  });
});

app.use(function(req,res,next) {
  res.send(404,"Not found!");
});

app.use(function(err,req,res,next) {
  console.error(err.stack);
  res.send(500,"Server error");
});

var server = app.listen(cg.http.port, cg.http.host, function() {
  console.log('Listening on port %d', server.address().port);
});

for (var i in cg.system.plugins) {
  console.log("loading plugin",cg.system.plugins[i]);
  var path=fsanchor.resolve(cg.system.plugins[i],"plugins");
  var plugin=require(path);

  plugins.registerPlugin(plugin);
  plugin(plugins);
}