
fsanchor=require("../../fsanchor.js");
fs=require("fs");
pageItem=require("../../system/models/pageitem.js");
cg=require("../../config.js");
rdrec=require("../../modules/readDirRecursive");
User=require("../../system/models/user.js");
db=require("../../system/models/database.js").getInstance();

var sourceTracker={
  insertDebugScript:function(event,data) {
    var user=data.req.user;
    if (!checkRights(user)) { return; }

    var debCrNew="riseCMSEditCrNew=";
    if (data.code==404) {
      //add code for new page
      debCrNew+='"'+data.environment.req.url+'";';
    } else {
      debCrNew+='false';
    }
    debCrNew="<script>"+debCrNew+"</script>";

    //TODO remove hard-coded strings
    var debAnchorTag='<script>riseCMSHost="'+data.environment.host+'";</script>';
    var jsSources=[
      "js/libs/jQuery_v1.11.1.js",
      "js/DebugWindowTab.js",
      "js/DebugWindowFileTab.js",
      "js/DebugWindowLayout.js",
      "js/DebugWindowSearchTab.js",
      "js/DebugWindowItemLayout.js",
      "js/DebugWindowFileLayout.js",
      "js/DebugWindowSeachLayout.js",
      "js/debugWindow.js",
      "js/debug.js",
      "js/libs/ace-builds/src-noconflict/ace.js"
    ];
    var cssSources=[
      "css/debug.css"
    ];
    
    var jsTagStr="";
    for (var i in jsSources) {
      jsTagStr+='<script src="'+data.environment.host+'/content/plugins/editor/'+jsSources[i]+'"></script>\n';
    }

    var cssTagStr="";
    for (var i in cssSources) {
      cssTagStr+='<link rel="stylesheet" type="text/css" href="'+data.environment.host+'/content/plugins/editor/'+cssSources[i]+'">\n';
    }

    var debTag=debAnchorTag+jsTagStr+cssTagStr;

    //find head tag
    var res=data.page.replace(/<\/head>/i,debTag+"</head>");
    if (res.length==data.page.length) {
      //no header found, append script to end
      res+=debTag;
    }
    data.page=res;
  },

  addItemTrace:function(event,data) {
    var user=data.environment.req?data.environment.req.user:new User();
    if (!checkRights(user)) { return; }

    var link=data.itemLink;
    var item=data.itemLink.item;
    var dataTag=((link.dataObj))?"data-dataId='"+(link.dataObj.header.id)+"'":"";
    
    data.final=
      "\n<span class='riseCMSDebug' \
      data-tag='tag' \
      data-id='"+item.header.id+"' \
      data-name='"+item.header.name+"' \
      data-type='"+item.header.type+"' \
      "+dataTag+">\n"
      +data.final+
      "\n</span>\n";
    
    //"\n<div class='riseCMSDebug' data-tag='open'  data-id='"+id+"'></div>\n"
    //"\n<div class='riseCMSDebug' data-tag='close' data-id='"+id+"'></div>\n",
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

var headerColumns =["id" ,"section","path"  ,"name"  ,"uri_name","title" ,"parent","type"  ,"created"  ];
var headerEditable=[false,true     ,true    ,true    ,true      ,true    ,true    ,true    ,false      ];
var headerType    =["int","string" ,"string","string","string"  ,"string","string","string","timestamp"];

function isValidHeader(header,readonly) {
  if (readonly!=false) { readonly=true; }

  if (typeof header!="object") {
    return false;
  }

  for (var i in header) {
    var idx=headerColumns.indexOf(i);
    if ((idx==-1) || ((!readonly) && (headerEditable[idx]==false))) {
      return false;
    }
  }

  return true;
}

function editorInit(pluginHandler) {
  pluginHandler.on("page.post",sourceTracker.insertDebugScript);
  pluginHandler.on("item.compose.post",sourceTracker.addItemTrace);
  
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
        if (!isValidHeader(header)) {
          throw new Error("header data is invalid");
        }
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
        if (!isValidHeader(header)) {
          throw new Error("header data is invalid");
        }
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

  function isInt(val) {
    return (val === parseInt(val, 10))
  }

  function sendError(res,msg,err) {
    var resObj={
      code:404,
      desc:msg,
      err:err?err.toString():undefined
    };
    res.send(resObj);
  }

  pluginHandler.registerRoute("plugins","/editor/query/item",function(req,res,next) {
    var postData=paramObj(req);

    var header=undefined;
    if (postData.queryHeader!=undefined) {
      try {
        header=JSON.parse(postData.queryHeader);
        if (!isValidHeader(header,true)) {
          throw new Error("header data is invalid");
        }
      } catch(e) {
        sendError(res,"invalid json for item header",e);
        return;
      }
    }

    //assemble query - from header data
    var query=[];
    var params=[cg.database.pageTable];
    for (var i in header) {
      var idx=headerColumns.indexOf(i);
      switch (headerType[idx]) {
      case "string":
        if (typeof header[i]!="string") {
          sendError(res,"invalid header type at "+i);
          return;
        }

        query.push("(?? LIKE ? ESCAPE \"!\")");
        params.push(headerColumns[idx]);
        //escapes %,! and _ with !
        params.push("%"+header[i].replace(/%|!|_/g,"!$&")+"%");
        break;
      case "int":
      case "timestamp":
        if ((!(header[i] instanceof Array)) || (!isInt(header[i][0])) || (!isInt(header[i][1]))) {
          sendError(res,"invalid header type at "+i);
          return;
        }

        if (header[i][0]==header[i][1]) {
          query.push("(??=?)");
          params.push(headerColumns[idx]);
          params.push(header[i][0]);
        } else {
          query.push("(?? BETWEEN ? AND ?)");
          params.push(headerColumns[idx]);
          params.push(header[i][0]);
          params.push(header[i][1]);
        }
        break;
      default:
        throw new Error("unknown header type "+headerType[i]);
      }
    }

    if (query.length==0) {
      sendError(res,"no query header was given");
      return;
    }

    var queryStr="SELECT * FROM ?? WHERE "+query.join(" AND ");


    //query item headers
    db.query(queryStr,params,function(err,result) {
      if (err!=null) {
        sendError(res,"database error",err);
        return;
      }

      var dataObj={
        code:200,
        description:"ok",
        results:result,
      };
      res.send(dataObj);
    });
  });

  pluginHandler.registerRoute("plugins","/editor/",function(req,res,next) {
    res.send(JSON.stringify({code:404,error:'invalid url'}));
  });
}

function paramObj(req) {
  return (req.body.header||req.body.data)?req.body:req.query;
}

function resolveId(id) {
  return fsanchor.resolve(id,"storage");  
}


module.exports=editorInit;