var stat=require("../../status.js");
var DataPath=require("../models/DataPath.js");
var ItemLink=require("../models/itemLink.js");

PathResolver={

  /**
   * resolves a given dataPath and handles items
   * @param  {DataPath}   datapath    data path to be resolved
   * @param {ItemLink} itemlink item link of the current item
   * @param  {Array ItemLink}   childs      children of the current item
   * @param  {object}   environment [description]
   * @param  {Function} callback    (Status stat, * data) callback to be called
   * @param {boolean} forceSync forces callback to be syncronous (disables item composing)
   * @param {array DataPath/undefined} resPath array of paths which need to be resolved on order to follow datapath (used by the function itself, can be left undefined)
   * @async
   * @sync
   */
  follow:function(datapath,itemlink,childs,environment,callback,forceSync,resPaths,itemInterpreter) {
    if (!forceSync) { forceSync=false; }
    if (!resPaths) {
      resPaths=[datapath];
    } else {
      if (resPaths.indexOf(datapath)!=-1) {
        callback(new stat.states.items.UNKNOWN_VARIABLE({
          msg:"loop in data path",
          path:datapath.path,
          trace:resPaths
        }));
        return;
      }
      resPaths.push(datapath);
    }
    
    if (datapath.path.length<=1) {
      callback(new stat.states.items.UNKNOWN_VARIABLE({
        msg:"unknown data path (path length < 2)",
        path:datapath.path
      }));
      return;
    }

    //TODO: if child array assembly is moved to parse, read data from the item links
    var rp_root=new DataPath();
    if (datapath.scope) {
      childs=datapath.scope.childs;
    }

    if (datapath.path[0]=="child") {
      if (childs.length!=0) {
        rp_root.addPath("child" ,childs[childs.length-1],false);
      } else {
        callback(new stat.states.items.ITEM_HAS_NO_CHILD({
          path:datapath.path
        }));
        return;
      }
    }

    var data=childs.slice();
    if (datapath.scope) {
      data.push(datapath.scope.root);
    } else {
      data.push(itemlink);
    }
    rp_root.addPath("data"  ,data ,true);
    rp_root.addPath("global",environment,false);
    datapath.usePaths(rp_root);

    /**
     * checks item for data and returns data object on success
     * @param  {Item} item item to be checked
     * @return {undefined/*}          returns undefined on error or data object if data was found
     */
    function checkData(item) {
      if (!item.isValid()) {
        return {err:"data item is invalid"};
      } else {
        if ((item.header) && (item.header.type=="data")) {
          return {data:h.data};
        } else {
          return {data:{}};
        }
      }
    }

    //data is delivered async, discard sync result
    var rpDiscard=false;
    var lastIdx=-1;

    datapath.resolve(function(err,result) {
      if (err) {
        callback(new stat.states.items.UNKNOWN_VARIABLE({
          msg:err,
          path:datapath.path,
          errSection:lastIdx+1
        }));
      } else {
        if (!rpDiscard) {
          callback(new stat.states.items.OK(),result);
        }
      }
    },function(path, pathIndex, currentValue, self) {
      lastIdx=pathIndex;

      if (currentValue.h instanceof ItemLink) {
        if (pathIndex==path.length-1) {
          //path point to item link; do not access data scopes
          return;
        }

        //check inline data
        var nextSection=path[pathIndex+1];
        //check if the item is to be composed or its data accessed
        if ((nextSection="text") && (pathIndex+1==path.length-1)) {
          currentValue.end=true;
          rpDiscard=true;

          if (forceSync) {
            callback(new stat.states.items.UNKNOWN_VARIABLE({
              msg:"item composing is not allowed with syncronous resolve"
            }));
          } else {
            var asChild=false;
            if (path[0]=="child") {
              asChild=true;
            }

            itemInterpreter.compose(
              currentValue.h,
              function(itemStr) {
                callback(new stat.states.items.OK(),itemStr);
              },
              [],asChild,environment
            );
          }
        } else {
          //access data
          if (currentValue.h.data) {
            //look ahead if next path section matches
            if (currentValue.h.data[nextSection]!=undefined) {
              currentValue.h=currentValue.h.data;
              return;
            } else {
              var check=checkData(currentValue.h.item);
              if (check.err) {
                currentValue.end=true;
                rpDiscard=true;
                callback(new stat.states.items.INVALID_ITEM_FILE({
                  msg:check.err,
                  path:datapath.path,
                  errSection:lastIdx
                }));
              } else {
                currentValue.h=check.data;
              }
            }
          }
        }
      } else {
        if (currentValue.h instanceof DataPath) {
          //try resolving data path
          PathResolver.follow(currentValue.h,itemlink,childs,environment,function(status,data) {
            if (stat.isSuccessfull(status)) {
              currentValue.h=data;
            } else {
              currentValue.end=true;
              rpDiscard=true;
              callback(new stat.states.items.INVALID_ITEM_FILE({
                msg:"could not resolve path segment",
                status:status.toString()
              }));
            }
          },true,resPaths);
        }
      }
    },function(path, pathIndex, currentValue, self) {
      if (currentValue.next instanceof ItemLink) {
        var nextSection=path[pathIndex];
        
        //test inline data
        if (currentValue.next.data) {
          if (currentValue.next.data[nextSection]!=undefined) {
            currentValue.next=currentValue.next.data;
            return;
          }
        }

        //test item data
        if ((currentValue.next.item.data) && (currentValue.next.item.data[nextSection])) {
          currentValue.next=currentValue.next.item.data;
        }
      }
    });
  }
}

module.exports=PathResolver;