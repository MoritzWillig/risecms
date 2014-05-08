//load configuration
var cg=require('./config.js');
var item=require("./system/models/pageitem.js");
var stat=require("./status.js");
var fsanchor=require("./fsanchor.js");
fsanchor.set("storage","./storage/")

var express=require('express');

var app=express();

app.use("/content",express.static("public/content"));

app.all('/', function(req, res){
  item.loadByPath(req.url,function(page,error) {
    var httpRes=stat.toHTTP(page,error);
    res.send(httpRes.code,httpRes.data);
  },{
    global:{
      host:"http://127.0.0.1:8800",
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

var server = app.listen(cg.http.port, function() {
  console.log('Listening on port %d', server.address().port);
});