
fsanchor=require("../../fsanchor.js");
fs=require("fs");
pageItem=require("../../system/models/pageitem.js");
cg=require("../../config.js");
rdrec=require("../../modules/readDirRecursive");

var sourceTracker={
  insertDebugScript:function(event,data) {
    var user=data.req.user;
    if (!checkRights(user)) { return; }

    var debCrNew="riseCMSEditCrNew=";
    if (data.httpRes.code==404) {
      //add code for new page
      debCrNew+='"'+data.global.req.url+'";';
    } else {
      debCrNew+='false';
    }
    debCrNew="<script>"+debCrNew+"</script>";

    var debJqrTag='<script src="'+data.global.host+'/content/plugins/editor/js/libs/jQuery_v1.11.1.js"></script>'
    var debSrcTag='<script src="'+data.global.host+'/content/plugins/editor/js/debug.js"></script>';
    var debCssTag='<link rel="stylesheet" type="text/css" href="'+data.global.host+'/content/plugins/editor/css/debug.css">';
    var debAncTag='<script>riseCMSHost="'+data.global.host+'";</script>';
    var debEdtTag='<script src="'+data.global.host+'/content/plugins/editor/js/libs/ace-builds/src-noconflict/ace.js"></script>';
    var debTag=debJqrTag+"\n"+debAncTag+"\n"+debCrNew+"\n"+debEdtTag+"\n"+debSrcTag+"\n"+debCssTag+"\n";
    //find head tag
    var res=data.httpRes.data.replace(/<\/head>/i,debTag+"</head>");
    if (res.length!=data.httpRes.data) {
      //no header found, append script to end
      res+=debTag;
    }
    data.httpRes.data=res;
  },
  addStrTrace:function(event,data) {
    var user=data.addData.global.req.user;
    if (!checkRights(user)) { return; }

    var dataTag=((data.addData.data)&&(typeof data.addData.data._debugId!="undefined"))?
      "data-dataId='"+(data.addData.data._debugId)+"'":
      "";
    
    data.string=
      "\n<span class='riseCMSDebug' \
      data-tag='tag' \
      data-id='"+data.id+"' \
      data-name='"+data.addData.header.name+"' \
      data-type='"+data.addData.header.type+"' \
      "+dataTag+">\n"
      +data.string+
      "\n</span>\n";
    
    //"\n<div class='riseCMSDebug' data-tag='open'  data-id='"+id+"'></div>\n"
    //"\n<div class='riseCMSDebug' data-tag='close' data-id='"+id+"'></div>\n",
  },
  addDataTrace:function(event,data) {
    var user=data.addData.global.req.user;
    if (!checkRights(user)) { return; }

    data.data._debugId=data.id;
  }
};

function checkRights(user) {
  for (var i in cg.plugins.editor.users) {
    if (user.is(cg.plugins.editor.users[i])) {
      return true;
    }
  }
  return false;
}

function editorInit(pluginHandler) {
  pluginHandler.on("page.post",sourceTracker.insertDebugScript);

  pluginHandler.on("itemStr.post",sourceTracker.addStrTrace);
  pluginHandler.on("itemData.post",sourceTracker.addDataTrace);
  
  pluginHandler.registerRoute("plugins","/editor/",function(req,res,next) {
    if (checkRights(req.user)) {
      next();
      return;
    }
    
    //not authenticated
    res.send({
      code:403,
      desc:"permission denied",
    });
  });

  pluginHandler.registerRoute("plugins","/editor/:id(\\d+)/get",function(req,res,next) {
    var id=req.params.id;
    var path=resolveId(id);

    fs.readFile(path,function(err,data) {
      //TODO: check for real error or if file does not exist
      data=(!err)?data.toString():undefined;

      pageItem.getHeader(id,function(err,header) {
        if (!stat.isSuccessfull(err)) { res.send("{code:404,description:'database error'}"); return; }

        var dataObj={
          code:200,
          description:"ok",
          id:id,
          header:header,
          data:data
        };
        res.send(JSON.stringify(dataObj));
      });
    });
  });
  pluginHandler.registerRoute("plugins","/editor/:id(\\d+)/set",function(req,res,next) {
    var id=req.params.id;
    var postData=paramObj(req);
    var data =postData.data;
    var header;
    if (postData.header!=undefined) {
      try {
        header=JSON.parse(postData.header);
      } catch(e) {
        var resObj={
          code:404,
          desc:"invalid json for item header",
          err:e.toString()
        };
        res.send(resObj);
        return;
      }
    }

    updateId(id,data,header,res);
  });
  function updateId(id,data,header,res) {
    var path=resolveId(id);

    if (typeof data!="undefined") {
      //update file
      fs.writeFile(path,data,function(err) {
        var failed=(!!err);
        var resObj={
          code:failed?404:200,
          desc:failed?"could not save data":"ok",
          id:id,
          err:failed?err:undefined
        }
        res.send(resObj);
      });
    }

    if (typeof header!="undefined") {
      //update db entry
      pageItem.setHeader(id,header,function(err,result) {
        var failed=(!stat.isSuccessfull(err));
        var resObj={
          code:failed?404:200,
          desc:failed?"could not save header":"ok",
          id:id,
          err:failed?err:undefined
        }
        res.send(resObj);
      });
    }

    if ((typeof data=="undefined") && (typeof header=="undefined")) {
      var resObj={
        code:200,
        desc:"ok",
        id:id,
        info:"no action was requested"
      }
      res.send(resObj);
    }
  }

  pluginHandler.registerRoute("plugins","/editor/new",function(req,res,next) {
    var postData=paramObj(req);
    var data =postData.data;
    var header=undefined;
    if (postData.header!=undefined) {
      try {
        header=JSON.parse(postData.header);
      } catch(e) {
        var resObj={
          code:404,
          desc:"invalid json for item header",
          err:e.toString()
        };
        res.send(resObj);
        return;
      }
    }
    
    //create entry
    pageItem.setHeader(undefined,header,function(err,result) {
      var failed=(!stat.isSuccessfull(err));
      if (failed) {
        var resObj={
          code:404,
          desc:"create new item header",
          err:err
        };
        res.send(resObj);
        return;
      }

      newId=result.insertId;
      updateId(newId,data,undefined,res);
    });
  });

  pluginHandler.registerRoute("plugins","/editor/content/list",function(req,res,next) {
    var path=fsanchor.resolve("","content");
    rdrec(path,function(err,files) {
      if (err) {
        res.send({
          code:404,
          err:err
        });
        return;
      }
      
      res.send({
        code:200,
        dir:files
      });
    });
  });

  pluginHandler.registerRoute("plugins","/editor/content/get/:path(**)",function(req,res,next) {
    var path=req.params.path;
    var nPath=fsanchor.resolve(path,"content");
    var cont=fsanchor.resolve("","content");

    //check path is under content
    if (nPath.substr(0,cont.length)===cont) {
      fs.readFile(nPath,function(err,data) {
        if (err) {
          res.send({
            code:403,
            err:err,
            path:path
          });
          return;
        }

        res.send({
          code:200,
          path:path,
          data:data.toString()
        });
      });
    } else {
      res.send({
        code:403,
        descr:"invalid directory"
      });
    }
  });

  pluginHandler.registerRoute("plugins","/editor/content/set/:path(**)",function(req,res,next) {
    var path=req.params.path;
    var nPath=fsanchor.resolve(path,"content");
    var cont=fsanchor.resolve("","content");

    var postData=paramObj(req);
    var data =postData.data;

    //check path is under content
    if (nPath.substr(0,cont.length)===cont) {
      fs.writeFile(nPath,data,function(err) {
        if (err) {
          res.send({
            code:403,
            err:err,
            path:path
          });
          return;
        }
        
        res.send({
          code:200,
          path:path
        });
      });
    } else {
      res.send({
        code:403,
        descr:"invalid directory"
      });
    }
  });

  pluginHandler.registerRoute("plugins","/editor/",function(req,res,next) {
    res.send("{code:404,error:'invalid url'}");
  });
}

function paramObj(req) {
  return (req.body.header||req.body.data)?req.body:req.query;
}

function resolveId(id) {
  return fsanchor.resolve(id,"storage");  
}


module.exports=editorInit;