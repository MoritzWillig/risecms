
fsanchor=require("../../fsanchor.js");
fs=require("fs");
pageItem=require("../../system/models/pageitem.js");
cg=require("../../config.js");

var sourceTracker={
  addStrTrace:function(event,data) {
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
    data.data._debugId=data.id;
  }
};

function editorInit(pluginHandler) {
  pluginHandler.on("itemStr.post",sourceTracker.addStrTrace);
  pluginHandler.on("itemData.post",sourceTracker.addDataTrace);
  
  pluginHandler.registerRoute("plugins","/editor/",function(req,res,next) {
    for (var i in cg.plugins.editor.users) {
      if (req.user.is(cg.plugins.editor.users[i])) {
        next();
        return;
      }
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

  pluginHandler.registerRoute("plugins","/editor/",function(req,res,next) {
    res.send("{code:404,error:'invalid url'}");
  })
}

function paramObj(req) {
  return (req.body.header||req.body.data)?req.body:req.query;
}

function resolveId(id) {
  return fsanchor.resolve(id,"storage");  
}


module.exports=editorInit;