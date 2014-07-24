Item=require("../models/item.js");
Script=require("../models/script.js");
ItemLink=require("../models/itemLink.js");
findParenthesis=require("../helpers/parenthesis.js").findParenthesis;
findNSurr=require("../helpers/parenthesis.js").findNSurr;
scriptEnv=new (require("./scriptEnvironment.js"))();

plugins=require("./pluginHandler.js");


itemInterpreter={
  /**
   * loads an item from a given id
   * @param  {string/int}   id       id, name or path of item
   * @param  {bool}   asPath   whether or not the item id is interpreted as a path
   * @param  {Function} callback callback to be called when the item is loaded
   * @param  {*}   data          additional data to be attached to the item
   */
  create:function(id,asPath,callback,data) { console.log("loading",id);
    if (callback==undefined) { callback=function() {}; }
    
    var root=new Item(id,asPath);
    root.loadHeader(cbInterpret);

    function cbInterpret() {
      if (!root.isValid()) {
        callback(root);
        return;
      }

      id=root.header.id;
      
      //reset item
      root.itemStr=[]
      root.dataObj=undefined;
      
      root.loadFile(cbFile);

      function cbFile(item) {
        if (!root.isValid()) {
          callback(root);
          return;
        }

        itemInterpreter.parse(root,callback);
      }
    }

    return root;
  },

  parse:function(root,callback) {
    var itemLoaded=false;
    var parentLoaded=false;

    switch (root.header.type) {
    case "static":
      interpretStatic();
      break;
    case "text":
      interpretText();
      break;
    case "script":
      interpretScript();
      break;
    case "data":
      interpretData();
      break;
    default:
      root.statusHeader=new stat.states.items.UNKNOWN_RESOURCE_TYPE();
      checkCallback(true);
      break;
    }

    function interpretText() {
      root.itemStr=[root.file];
      checkCallback(true);
    }

    function interpretStatic() {
      var str=root.file;
      
      //extract subitem strings
      var lastItemEnd=0;
      var res=findParenthesis(str,"{{","}}","\\",lastItemEnd);
      while ((!(res<0)) && (
        !((res[0]==-1) && (res[1]==-1)))) {
        //save plain text which does not contain item information
        var nItemStr=str.substr(lastItemEnd,res[0]-lastItemEnd);
        if (nItemStr!="") {
          root.itemStr.push(nItemStr);
        }
        lastItemEnd=res[1];

        var si={
          range:res,
          str:str.substr(res[0]+"{{".length,res[1]-res[0]-"{{".length-"}}".length)
        };
        root.itemStr.push(si);
        
        res=findParenthesis(str,"{{","}}","\\",lastItemEnd);
      }
      
      if (res<0) {
        var idx=-(res-1);
        var sub=str.substr(idx,10);
        root.statusFile=new stat.states.static.MISMATCHING_PARENTHESIS({position:idx,substr:sub});
        checkCallback(true);
      } else {
        //save last plain text which does not contain item information
        var nItemStr=str.substr(lastItemEnd,str.length);
        if (nItemStr!="") {
          root.itemStr.push(nItemStr);
        }

        
        //split and parse subitem strings
        var subItemCt=1;
        for (var i=0; i<root.itemStr.length; i++) {
          if (typeof root.itemStr[i]=="string") {
            //skip plaintext
            continue;
          }
          var s=root.itemStr[i].str;
          var last=0;
          
          var id="";
          var addData=undefined;
          var script=undefined;

          //extract name
          var idx=s.indexOf("|",0);
          if (idx!=-1) {
            id=s.substr(last,idx);
            s=s.substr(idx+1,s.length);
            
            last=idx+1;
          } else {
            id=s;
            last=s.length;
            s="";
          }

          //extract data
          if (s.length!=0) {
            idx=findNSurr(s,"|",0,"\"");
            if (idx!=-1) {
              addData=s.substr(last,idx);
              s=s.substr(idx+1,s.length);
            } else {
              addData=s;
              s="";
            }
          }

          //extract script
          if (s.length!=0) {
            script=new Script();
            var e=script.loadText(s);
            if (e!=null) {
              //throw error
              root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
                action:"parsing inline script",
                exp:s,
                error:e,
                errorStr:e.toString()
              });
              checkCallback(true);
              return;
            }
          }

          if (addData!=undefined) {
            if (isInline(addData)) {
              //parse inline data
              addData=addData.substr(1,addData.length);
              try {
                addData=JSON.parse(addData);
                dataCb();
              } catch(e) {
                root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
                  action:"parsing JSON",
                  error:e,
                  errorStr:e.toString()
                });
                checkCallback(true);
                return;
              }
            } else {
              //load inline data from item
              itemInterpreter.create(addData,false,function(item) {
                if (!item.isValid()) {
                  //data item has to be valid
                  root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
                    action:"loading data item - invalid item"
                  });
                  checkCallback(true);
                  return;
                } else {
                  //data item has to be from type "data"
                  if (item.header.type=="data") {
                    addData=item.dataObj;
                    dataCb();
                  } else {
                    root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
                      action:"loading data item - item has to be from type data"
                    });
                    checkCallback(true);
                    return;
                  }
                }
              },undefined);
            }
          } else {
            //no inline data was given continue
            dataCb();
          }

          function dataCb() {
            if (!isInline(id)) {
              //parse as item
              subItemCt++;
              
              //load sub item
              root.itemStr[i]=new ItemLink(
                itemInterpreter.create(id,false,subItemCallback),
                addData,
                {post:[script]}
              );
              
              root.itemStr[i].item.parent=root;
            } else {
              //as variable path - evaluated on compose
              root.itemStr[i]=id.split(".");
              root.itemStr[i][0]=root.itemStr[i][0].substr(1,root.itemStr[i][0].length); //removed leading $
            }
          }
        }

        //check if all items are already loaded - use this with itemCt=1 
        //to prevent syncronous callbacks to return before the subItem.script could be set
        subItemCallback(undefined);
        
        function isInline(str) { return ((str.length>0) && (str[0]=="$")); }
        function extractData(str) {
          if (isInline(str)) {
            return s.substr(1,str.length);
          } else {
            return str;
          }
        }

        function subItemCallback(subItem) {
          subItemCt--;
          //if all sub items are loaded return
          if (subItemCt==0) {
            checkCallback(true);
          }
        }

      }
    }

    function interpretScript() {
      var path=root.resolveIdPath();
      var script=new Script();
      var e=script.loadFile(path);
      if (e!=null) {
        root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
          action:"parsing script",
          error:e,
          errorStr:e.toString()
        });
      } else {
        root.script=script;
      }
      checkCallback(true);
    }

    function interpretData() {
      try {
        root.dataObj=JSON.parse(data);
        root.statusFile=new stat.states.items.OK();
      } catch(e) {
        root.statusFile=new stat.states.items.INVALID_ITEM_FILE({action:"parsing file as json"});
      }
      checkCallback(true);
    }

    //load parent
    var parentName=root.header.parent;
    if (parentName!="") {
      var parent=itemInterpreter.create(parentName,false,function() {
        parentLoaded=true;
        checkCallback();
      },undefined);
      root.staticParent=parent;
    } else {
      parentLoaded=true;
      checkCallback();
    }


    function checkCallback(addItemLoaded) {
      if (addItemLoaded==true) { itemLoaded=true; }
      if (itemLoaded && parentLoaded) {
        callback(root);
      }
    }
    
    return root;
  },

  /**
   * creates a string representing the item structure
   * @param  {ItemLink}   itemLink     itemLink to parse
   * @param  {Function} callback callback to return if the item is composed
   * @param  {[[Item]]}   childs   chain of item childs (set from parent items)
   * @param  {bool}   asChild  whether or not this item is parsed as child
   * //@param  {[[ItemLink]]}   data     additional data scopes which can be accessed throughout parsing
   * @param  {[Object]} environment environment data scope
   */
  compose:function(itemLink,callback,childs,asChild,environment) {
    if (typeof childs=="undefined") { childs=[]; }
    if (typeof asChild=="undefined") { asChild=false; }
    if (typeof environment=="undefined") { environment={}; }
    var item=itemLink.item;

    if ((!asChild) && (item.staticParent!=undefined)) {
      //compose parent - this item (if needed) will be composed again as child (=> asChild==true)
      childs.push(item);
      var link=new ItemLink(item.staticParent);
      itemInterpreter.compose(link,callback,childs,false,environment);
      childs.pop();
    } else {
      //parse item normally
      
      switch (item.header.type) {
      case "static":
        break;
      case "text":
        callback(item.itemStr[0]);
        return;
      case "script":
        scriptEnv.run(item.script,{
          item:item,
          data:itemLink.data,
          environment:environment
        },function(result) {
          callback(result);
        },((item.header.name!="")?item.header.name:(item.header.path)?item.header.path:"")+"["+item.header.id+"]");
        return;
      case "data":
        callback("%%%not implemented yet%%%");
        return;
      default:
        callback((new stat.states.items.UNKNOWN_RESOURCE_TYPE()).toString());
        return;
      }

      var cs={};
      var itemsCt=1;
      for (var i=0; i<item.itemStr.length; i++) {
        var s=item.itemStr[i];

        itemsCt++;
        if (typeof s!="string") {
          if (s instanceof ItemLink) {
            //cs[i]="%%%ITEM%%%"; itemCb();

            if (s.item.isValid()) {
              //TODO: is item in this case really a child, to the subitem?
              //create copy of childs, because of possibly async calls
              var chLocal=childs.slice();
              chLocal.push(item);

              itemInterpreter.compose(s,(function(i) { return function(itemStr) {
                cs[i]=itemStr;
                itemCb();
              }; })(i),chLocal,false,environment);
            } else {
              cs[i]=
                s.item.statusHeader.toString()+"\n"+
                s.item.statusFile  .toString()+"\n";
              itemCb();
            }
            
          } else {
            //is variable
            //lookup data from data scope

            /*
            child - data delivered from child
            data - inline or item data
            environment - environment data object
            plugins - plugin specific data - planned - to be done
            */
            var v=s;
            if (v.length<=1) {
              cs[i]=(new stat.states.items.INVALID_ITEM_FILE({action:"variable contains no path"})).toString();
              itemCb();
            } else {
              var r;
              switch (v[0]) {
              case "child":
                if (childs.length==0) {
                  cs[i]=(new stat.states.items.ITEM_HAS_NO_CHILD()).toString();
                  itemCb();
                } else {
                  var chLocal=childs.slice();
                  chLocal.pop();
                  
                  var link=new ItemLink(childs[childs.length-1]);
                  itemInterpreter.compose(
                    link,(function(i) { return function(itemStr) {
                      cs[i]=itemStr;
                      itemCb();
                    }; })(i),
                    chLocal,true,environment
                  );
                }
                break;
              case "data":
                //search inline data
                if (typeof itemLink.data[v[1]]!="undefined") {
                  r=itemLink.data;
                } else {
                  if (typeof item.dataObj[v[1]]!="undefined") {
                    //read from local data scope
                    r=item.dataObj;
                  } else {
                    //search child tree
                    for (var c=childs.length-1; c>=0; c--) {
                      if (childs[c].dataObj[v[1]]) {
                        r=childs[c].dataObj;
                        break;
                      }
                    }
                  }
                }
                if (r!=undefined) {
                  follow(r,v);
                } else {
                  cs[i]=(new stat.states.items.UNKNOWN_VARIABLE({"path":v.join(".")})).toString();
                  itemCb();
                }
                break;
              case "global":
                r=environment;
                follow(r,v);
                break;
              default:
                cs[i]=(new stat.states.items.UNKNOWN_VARIABLE_ROOT({rootName:v[0]})).toString();
                itemCb();
              }

              function follow(root,path) {
                for (var c=1; c<path.length; c++) {
                  if (typeof root[path[c]]!="undefined") {
                    root=root[path[c]];
                  } else {
                    root=undefined;
                    break;
                  }
                }
                switch (typeof root) {
                case "boolean":
                  cs[i]=root?"true":"false";
                  break;
                case "string":
                case "number":
                case "symbol":
                  cs[i]=root;
                  break;
                case "object":
                  if (root==null) {
                    cs[i]="null";
                  } else {
                    if (root instanceof Item) {
                      cs[i]="%%%Item%%%";
                    } else {
                      cs[i]=(new stat.states.items.INVALID_VARIABLE_TYPE({"path":v.join(".")})).toString();
                    }
                  }
                  break;
                case "function":
                  //functions are not allowed
                case "undefined":
                  //follow() would have already thrown an error if undefined
                  cs[i]=(new stat.states.items.UNKNOWN_VARIABLE({"path":v.join(".")})).toString();
                  break;
                default:
                  cs[i]=(new stat.states.items.UNKNOWN_VARIABLE({"path":v.join("."),"msg":"unkown type"})).toString();
                  break;
                }
                itemCb();
              }
            }
          }
        } else {
          //is plaintext
          cs[i]=s;
          itemCb();
        }
      }
      itemCb();

      function itemCb() {
        itemsCt--;
        if (itemsCt==0) {
          var final=(cs[0]==undefined)?"":cs[0];
          for (var i=1; cs[i]!=undefined; i++) {
            final+=cs[i];
            
            //TODO: CALL ITEM SCRIPT
          }

          var evtObj={final:final,itemLink:itemLink,childs:childs,asChild:asChild,environment:environment};
          plugins.trigger("item.compose.post",evtObj);

          callback(evtObj.final);
        }
      }
    }
  }
};

(function registerEvents() {
  /**
   * @event item.compose.pre
   * @param {ItemLink} itemLink item link to be composed
   * @param {[Item]} childs array of childs
   * @param {bool} asChild wether or not the item link is parsed as a child
   * @param {object} environment additional data passed for composing
   */
  plugins.registerEvent("item.compose.pre");
  /**
   * @event item.compose.post
   * @param {sting} final the parsed string which will be returned
   * @param {ItemLink} itemLink item link to be composed
   * @param {[Item]} childs array of childs
   * @param {bool} asChild wether or not the item link is parsed as a child
   * @param {object} environment additional data passed for composing
   */
  plugins.registerEvent("item.compose.post");
})();


module.exports=itemInterpreter;