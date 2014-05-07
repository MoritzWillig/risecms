cg=require("../../config.js");
stat=require("../../status");
db=require("./database").getInstance();
fs=require("fs");
fsanchor=require("../../fsanchor.js");

//helper function to check wether or not an variable is an number
function checkNumber(x) {
  return !isNaN(+x);
}

/**
 * removes the module from the cache to make it possible to
 * free it by the gc if no other references exist.
**/
function unrequire(module) {
  delete require.cache[require.resolve(module)];
}

pageItem={
  /**
   * @param text text to parse
   * @param callback function(string,status) parsed text; status
  **/
  parse:function(text,parseData,callback) { console.log("parseData: ",parseData);
    text=text.toString();

    var cache=[];
    var missing=1;

    //parse text for "{{...}}"
    var requestId=0;
    text=text.replace(/([^\\]|^){{(.*?)}}/g,function(match,pre,data) {
      missing++;
      cache.push(data);

      return pre+"{{"+requestId+++"}}";
    });

    //accept item and insert into result
    function accept(id,data,status) {
      if (id!=-1) { //main item is id=-1
        console.log("recived ",id," -> ",data);
        if (stat.isSuccessfull(status)) {
          cache[id]=data;
        } else {
          status.info={method:"parse accepting sub-item",id:id,data:data,origin:status.info};
          cache[id]=status.toString();
        }
      }
      
      //test if item is completely loaded
      missing--;
      if (missing==0) {
        //replace sub-items
        var requestId=0;
        text=text.replace(/([^\\]|^){{(.*?)}}/g,function(match,pre,data) {
          return pre+cache[requestId++];
        });
        callback(text,new stat.states.items.OK());
      }
    }

    for (var c in cache) { (function() { //replace this closure with let, if supported
      var item=cache[c];
      var id=c;

      //check and accept result
      var dbCallback=function(result,error) {
        status=error?error:new stat.states.database.OK();
        accept(id,result,status);
      };
      
      //load item
      if ((item[0]) && (item[0]=="$")) { console.log("found var "+item);
        //search for env var
        var v=item.substr(1,item.length).split(".");
        
        var p=parseData;
        var err;
        for (var i in v) {
          var n=v[i];

          console.log("set p by ",n," in ",p," to ",p[n]);

          if (typeof p[n] !=="undefined") {
            p=p[n];
          } else {
            if (cg.system.parser.empty_var_is_error) {
              err=new stat.states.items.INVALID_ITEM_FILE({description:"invalid variable",name:item,id:id,parseData:parseData});
            } else {
              p="";
            }
            break;
          }
        }

        console.log("out ",p);
        if ((!err) && (typeof p==="undefined")) {
          if (cg.system.parser.empty_var_is_error) {
            err=new stat.states,items.INVALID_ITEM_FILE({description:"variable is undefined",name:item,id:id,parseData:parseData});
          } else {
            p="";
          }
        }
        console.log("out ",p);

        if (!err) {
          accept(id,p.toString(),new stat.states.items.OK);
        } else {
          accept(id,null,err);
        }

      } else {
        //load from db
        if (checkNumber(item)) { console.log("item "+item);
          pageItem.loadById(item,dbCallback);
        } else {
          pageItem.loadByName(item,dbCallback);
        }
      }
      })();
    }

    //try load (if no sub items exist)
    accept(-1,null,new stat.states.items.OK());
  },
  getResourceString:function(id,type,callback) {
    var path=fsanchor.resolve(id,"storage");

    switch (type) {
      case "static":
        fs.readFile(path,function(err,data) {
          if (err) {
            callback(null,new stat.states.items.INVALID_ITEM_FILE({id:id,type:type}));
          } else {
            callback(data,new stat.states.items.OK());
          }
        });
        break;
      case "script":
        //require as module
        var result=null;
        var status;

        function cb(str) {
          unrequire(path);
          callback(str,new stat.states.items.OK());
        }

        try {
          var script=require(path);
          result=script(cb);
        } catch(e) {
          callback(null,new stat.states.ITEM_ERROR({description:"executing script",id:id,type:type,error:e}));
        }
        break;
      default:
        callback(null,new stat.states.UNKNOWN_RESOURCE_TYPE({id:id,type:type}));
    }
  },
  createResult:function(result,err,callback,addData) {
    if (!err) {
      if ((result) && (result[0])) { console.log("loading storage/"+result[0].id);
        //combine with parent
        var item;
        var parent;
        var hasParent=!!result[0].parent; //to bool
        
        function accept() {
          if (hasParent) {
            if (item && parent) { console.log("accepted item with parent");
              //parse parent
              console.log("parsing ",parent);
              pageItem.parse(parent,{child:{text:item}},function(finalStr) {
                callback(finalStr,new stat.states.items.OK());
              });
            } //else parent or item not loaded
          } else { console.log("accept item (no parent)");
            //no parent needed -> return
            callback(item,new stat.states.items.OK());
          }
        }

        //load & parse item
        pageItem.getResourceString(result[0].id,result[0].type,function(data,err) {
          console.log("loading resouce");
          if (!stat.isSuccessfull(err)) {
            callback(null,new stat.states.items.ITEM_ERROR({description:"loading resource string",id:result[0].id,type:result[0].type,error:err}));
          } else {
            pageItem.parse(data,{},function(itemStr) {
              item=itemStr;
              accept();
            });
          }
        });

        //load parent
        if (hasParent) {
          //check and accept result
          var dbCallback=function(pResult,error) { console.log("loaded parent");
            var status=error?error:new stat.states.database.OK();
            
            if (status instanceof stat.states.items.OK) {
              parent=pResult;
            } else {
              status.info={
                method:"createResult - loading parent",
                result:pResult,
                origin:{
                  status:err,
                  result:result[0]
                }
              };
              parent=status.toString();
            }
            accept();
          };

          parse with child data only!!!
          if (checkNumber(result[0].parent)) {
            pageItem.loadById(result[0].parent,dbCallback);
          } else {
            pageItem.loadByName(result[0].parent,dbCallback);
          }
        }
      } else {
        //error item does not exist
        callback(null,new stat.states.items.NOT_FOUND({result:result,error:err}));
      }
    } else {
      callback(null,new stat.states.database.INVALID_QUERY({result:result,error:err}));
    }
  },
  loadById:function(id,callback,data) { console.log("requested id "+id);
    if (typeof data==="undefined") { data={}; }
    var query=db.query('SELECT * FROM ?? WHERE id=?',[cg.database.pageTable,id],function(err, result) {
      pageItem.createResult(result,err,callback,data);
    });
  },
  loadByName:function(name,callback,data) { console.log("requested name "+name);
    if (typeof data==="undefined") { data={}; }
    var query=db.query('SELECT * FROM ?? WHERE name=?',[cg.database.pageTable,name],function(err, result) {
      pageItem.createResult(result,err,callback,data);
    });
  },
  loadByPath:function(path,callback,data) { console.log("requested "+path);
    if (typeof data==="undefined") { data={}; }
    var query=db.query('SELECT * FROM ?? WHERE path=?',[cg.database.pageTable,path],function(err, result) {
      pageItem.createResult(result,err,callback,data);
    });
  }
};


module.exports=pageItem;