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
   * @param parseData additional data which can be used by templates
   * @param callback function(string,status) parsed text; status
  **/
  parse:function(text,parseData,callback) { //console.log("parseData: ",parseData);
    text=text.toString();

    var cache=[];
    var missing=1;

    //parse text for "{{...}}"
    var requestId=0;
    //console.log("searching text ",text);
    text=text.replace(/(\\?){{(.*?)}}/g,function(match,pre,data) {
      if (pre=="\\") {
        /*
          simulate lookbehind to make it possible to escape {{...}} with \
          we can not use [^\\] here as this would imply an preceding caracter
          not already matched by another group (=> matching "{{text}}{{other_text}}" 
          would not match the secoond group)
        */
        return match;
      }

      //console.log("found match ",">"+pre+"<",":",data);
      missing++;
      var idx=data.indexOf("|");
      if (idx==-1) {
        cache.push([data]);
      } else {
        cache.push([data.substr(0,idx),data.substr(idx+1,data.length)]);
      }

      return pre+"{{"+requestId+++"}}";
    });

    //accept item and insert into result
    function accept(id,data,status) {
      if (id!=-1) { //main item is id=-1
        //console.log("recived ",id," -> [",(typeof data),"]");
        if (stat.isSuccessfull(status)) {
          cache[id]=data;
        } else {
          status.info={
            method:"parse accepting sub-item",
            id:id,
            requested_name:cache[id][0],
            requested_data:cache[id][1],
            data:data,
            origin:status.info
          };
          cache[id]=status.toString();
        }
      }
      
      //test if item is completely loaded
      missing--;
      if (missing==0) {
        //replace sub-items
        var requestId=0;
        text=text.replace(/(\\?){{(.*?)}}/g,function(match,pre,data) {
          if (pre=="\\") { /*simulate lookbehind, see description above */ return match; }
          return pre+cache[requestId++];
        });
        callback(text,new stat.states.items.OK());
      }
    }

    for (var c in cache) { (function() { //replace this closure with let, if supported (cange return statement at try catch!!!)
      var id=c;

      var item=cache[c][0];
      var itemAddData;

      function loadWithData() {
        //add new layer to pass data on to item childs
        //but read variables from current scope!
        var parseDataCh={parent:parseData,data:itemAddData,global:parseData.global};
        //console.log("sub item => ",item," additional ",parseDataCh.inline);

        //check and accept result
        var dbCallback=function(result,error) {
          status=error?error:new stat.states.database.OK();
          accept(id,result,status);
        };
        
        //load item
        if ((item[0]) && (item[0]=="$")) { //console.log("found var "+item);
          //search for env var
          var v=item.substr(1,item.length).split(".");
          
          var p=parseData;
          var err;
          for (var i in v) {
            var n=v[i];

            //console.log("set p by ",n," in ",p," to ",p[n]);

            if (typeof p[n] !=="undefined") {
              p=p[n];
            } else {
              if (cg.system.parser.undef_item_is_error) {
                err=new stat.states.items.INVALID_ITEM_FILE({description:"invalid variable",name:item,id:id,parseData:parseData});
              } else {
                p="";
              }
              break;
            }
          }

          //console.log("out ",p);
          if ((!err) && (typeof p==="undefined")) {
            if (cg.system.parser.undef_item_is_error) {
              err=new stat.states,items.INVALID_ITEM_FILE({description:"variable is undefined",name:item,id:id,parseData:parseData});
            } else {
              p="";
            }
          }
          
          if (!err) {
            accept(id,p.toString(),new stat.states.items.OK);
          } else {
            accept(id,null,err);
          }

        } else {
          //load from db
          if (checkNumber(item)) { console.log("item "+item);
            pageItem.loadById(item,dbCallback,parseDataCh);
          } else {
            pageItem.loadByName(item,dbCallback,parseDataCh);
          }
        }
      };
      
      if (typeof cache[c][1]=="string") {
        if ((cache[c][1][0]) && (cache[c][1][0]=="$")) {
          //load parse json
          try {
            cache[c][1]=cache[c][1].substr(1,cache[c][1].length); //remove "$"
            cache[c][1]=cache[c][1].replace(/\\\}\\\}/g,"}}"); //replace "\}\}" with "}}"
            itemAddData=JSON.parse(cache[c][1]); //parse json
          } catch (e) {
            var err=new stat.states.items.INVALID_ITEM_FILE({
              description:"error parsing additional data",
              parseStr:cache[c][1],
              name:item,
              id:id,
              parseData:parseData,
              error:{
                errorObj:e,
                msg:e.message
              }
            });
            accept(id,null,err);
            return;
          }
          loadWithData();
        } else {
          //load data from item

          function handleDataReturn(data,e) {
            if (!stat.isSuccessfull(e)) {
              var err=new stat.states.items.INVALID_ITEM_FILE({
                description:"loading item data",
                parseStr:cache[c][1],
                name:item,
                id:id,
                parseData:parseData,
                error:{
                  errorObj:e,
                  msg:e.message
                }
              });
              accept(id,null,err);
              return;
            } else {
              itemAddData=data;
              loadWithData();
            }
          }

          if (checkNumber(cache[c][1])) {
            pageItem.loadById(cache[c][1],handleDataReturn,parseData);
          } else {
            loadWithData(cache[c][1],handleDataReturn,parseData);
          }
        }
      } else {
        itemAddData={};
        loadWithData();
      }
      })();
    }

    //try load (if no sub items exist)
    accept(-1,null,new stat.states.items.OK());
  },
  /**
   * return item template (from file template or script result)
   * @param id id of the item to be loaded
   * @param type type of the loaded item file to be interpreted
   * @param callback function to call if the item string is created
  **/
  getResourceString:function(id,type,addData,callback) {
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
          //TODO add caching system
          //unrequire(path);
          callback(str,new stat.states.items.OK());
        }

        try {
          var script=require(path);
          result=script(addData,cb);
        } catch(e) {
          callback(null,new stat.states.items.ITEM_ERROR({
            description:"executing script",
            id:id,
            type:type,
            error:{
              errorObj:e,
              msg:e.message,
              trace:e.stack.replace(/\n/g,"\n<br>")
            }
          }));
        }
        break;
      case "data":
        callback(null,new stat.states.items.INVALID_ITEM_FILE({
          description:"data items can not be parsed"
        }));
        break;
      default:
        callback(null,new stat.states.items.UNKNOWN_RESOURCE_TYPE({id:id,type:type}));
    }
  },
  /**
   * returns item data as object
   * @param id id of the item to be loaded
   * @param type type of the loaded item file
   * @param callback function to call if the item string is created
  **/
  getResourceData:function(id,type,addData,callback) {
    var path=fsanchor.resolve(id,"storage");

    switch (type) {
      case "data":
        fs.readFile(path,function(err,data) {
          if (err) {
            callback(null,new stat.states.items.INVALID_ITEM_FILE({id:id,type:type}));
          } else {
            try {
              data=JSON.parse(data);
              callback(data,new stat.states.items.OK());
            } catch(e) {
              callback(null,new stat.states.items.INVALID_ITEM_FILE({id:id,type:type,msg:"JSON"}));
            }
          }
        });
        break;
      default:
        callback(null,new stat.states.items.INVALID_ITEM_FILE({
          description:"item types other than data can not be loaded as JSON"
        }));
        break;
    }
  },
  /**
   * interprets query result with aditional data to item string
   * @param result query result
   * @param err error status from query
   * @param callback function to be called if finished
   * @param addData additional data to be used in templates and scripts
  **/
  createResult:function(result,err,callback,addData) {
    if (!err) {
      if ((result) && (result[0])) { console.log("loading storage/"+result[0].id);
        if (result[0].type=="data") {
          pageItem.getResourceData(result[0].id,result[0].type,addData,function(data,err) {
            console.log("loading data");
            if (!stat.isSuccessfull(err)) {
              callback(null,new stat.states.items.ITEM_ERROR({description:"loading resource data",id:result[0].id,type:result[0].type,error:err}));
            } else {
              callback(data,new stat.states.database.OK());
            }
          });
          return;
        }//else load other item types

        //combine with parent
        var item;
        var parent;
        var hasParent=!!result[0].parent; //to bool
        
        function acceptItem() {
          if (hasParent) {
            //check and accept result
            var dbCallback=function(pResult,error) { console.log("loaded parent");
              var status=error?error:new stat.states.database.OK();
              
              if (stat.isSuccessfull(status)) {
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
              
              callback(parent,new stat.states.items.OK());
            };

            //load parent

            //add data layer for parent
            addData.text=item;
            addData={global:addData.global,child:addData};

            if (checkNumber(result[0].parent)) {
              pageItem.loadById(result[0].parent,dbCallback,addData);
            } else {
              pageItem.loadByName(result[0].parent,dbCallback,addData);
            }
          } else {
            console.log("accept item (no parent)");
            //no parent needed -> return
            callback(item,new stat.states.items.OK());
          }
        }

        //load & parse item
        pageItem.getResourceString(result[0].id,result[0].type,addData,function(data,err) {
          console.log("loading resouce");
          if (!stat.isSuccessfull(err)) {
            callback(null,new stat.states.items.ITEM_ERROR({description:"loading resource string",id:result[0].id,type:result[0].type,error:err}));
          } else {
            //TODO add some item specific infos here (id,title,...)
            //addData.text=item;
            pageItem.parse(data,addData,function(itemStr) {
              item=itemStr;
              acceptItem();
            });
          }
        });
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