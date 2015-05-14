var Item=require("../models/item.js");
var Script=require("../models/script.js");
var ItemLink=require("../models/itemLink.js");
var findParentheses=require("../helpers/parentheses.js").findParentheses;
var findNSurr=require("../helpers/parentheses.js").findNSurr;
var scriptEnv=new (require("./scriptEnvironment.js"))();
var DataPath=require("../models/DataPath.js");
var PathResolver=require("../helpers/pathResolver.js");

var plugins=require("./pluginHandler.js");

//load item builders
var StaticBuilder=require("./builders/staticBuilder.js");
var TextBuilder=require("./builders/textBuilder.js");
var ScriptBuilder=require("./builders/scriptBuilder.js");
var DataBuilder=require("./builders/dataBuilder.js");
var BranchBuilder=require("./builders/branchBuilder.js");
var FallbackBuilder=require("./builders/fallbackBuilder.js");

var itemInterpreter={
  /**
   * loads an item from a given id
   * @param  {string/int}   id       id, name or path of item
   * @param  {bool}   asPath   whether or not the item id is interpreted as a path
   * @param  {Function} callback (ItemLink itemlink) callback to be called when the item is loaded
   * @return {ItemLink} returns an itemlink holding the item object (the item does not need to be loaded at this point)
   * @async
   */
  create:function create(id,asPath,callback) { console.log("loading",id);
    var root=new Item(id,asPath);
    root.loadHeader(cbInterpret);

    var link=new ItemLink(root);

    function cbInterpret() {
      if (!root.isValid()) {
        callback(link);
        return;
      }

      id=root.header.id;

      //reset item
      root.itemStr=[]
      root.dataObj=undefined;

      root.loadFile(cbFile);

      function cbFile(item) {
        if (!root.isValid()) {
          callback(link);
          return;
        }

        itemInterpreter.parse(link,callback);
      }
    }

    return link;
  },

  /**
   * parses the file attribute of an item
   * @param  {ItemLink}   link     link holding the item to be parsed
   * @param  {Function} callback (ItemLink itemlink) callback to be called when the item is loaded
   * @return {ItemLink} returns the item object (the item does not need to be loaded at this point)
   * @sync
   * @async
   */
  parse:function parse(link,callback) {
    var root=link.item;
    var itemLoaded=false;
    var parentLoaded=false;
    var branchesCount=0;

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
    case "branch":
      interpretBranch();
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
      root.file=null; //free memory

      //extract subitem strings
      var lastItemEnd=0;
      var res=findParentheses(str,"{{","}}","\\",lastItemEnd);
      while ((res[0]!=-1) && (res[1]!=-1) && (res[0]<res[1])) { //console.log("found new",res);
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

        res=findParentheses(str,"{{","}}","\\",lastItemEnd);
      }

      if ((res[0]!=-1) || (res[1]!=-1) || (res[0]>res[1])) {
        if ((res[0]!=-1) || (res[1]!=-1)) {
          var idx=(res[0]==-1)?res[1]:res[0];
          var sstr=str.substr(idx,10);
          root.statusFile=new stat.states.items.static.MISMATCHING_PARENTHESES({
            position:res,
            substr:sstr
          });
        } else {
          var sstr=str.substr(res[1],10);
          root.statusFile=new stat.states.items.static.MISMATCHING_PARENTHESES({
            msg:"closing before opening parentheses",
            position:res,
            substr:sstr
          });
        }

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
            var e=script.loadText(
              s,
              ["itemLink","item","data","environment","childs","module","require","__dirname"]
              ,"ScriptEnvironment"+(scriptName?":"+scriptName:"")
            ); //TODO create Script with scriptEnvironment and add module, require & __dirname args there

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

          if ((addData!=undefined) && (addData!="")) {
            if (isInline(addData)) {
              //parse inline data
              addData=addData.substr(1,addData.length);
              try {
                addData=JSON.parse(addData);
                dataCb();
              } catch(e) {
                var inlData=addData;
                addData=new Item();
                addData.statusFile=new stat.states.items.INVALID_ITEM_FILE({
                  action:"parsing inline JSON",
                  dataStr:inlData,
                  error:e,
                  errorStr:e.toString()
                });
                dataCb();
              }
            } else {
              //load inline data from item
              subItemCt++;
              itemInterpreter.create(addData,false,(function(i,id,script) { return function(itemL) {
                var item=itemL.item;
                subItemCt--;
                if (!item.isValid()) {
                  //data item has to be valid
                  addData=item;
                } else {
                  //data item has to be from type "data"
                  if (item.header.type=="data") {
                    addData=item;
                  } else {
                    addData=new Item();
                    addData.statusFile=new stat.states.items.INVALID_ITEM_FILE({
                      action:"loading data item - item has to be of type data",
                    });
                  }
                }
                dataCb(i,id,addData,script);
              }; })(i,id,script),undefined);
            }
          } else {
            //no inline data was given continue
            dataCb();
          }

          function dataCb(ai,aid,aaddData,ascript) {
            if (ai==undefined) { ai=i; aid=id; aaddData=addData; ascript=script; } //take vars from params if call is async
            if (!isInline(aid)) {
              //parse as item
              subItemCt++;

              //load sub item
              var il=itemInterpreter.create(aid,false,subDataParse);

              function subDataParse() {
                //search data paths
                var cpath=[];
                /**
                 * replaces references to other data with DataPaths
                 * @param  {object} obj object to search in
                 * @return {object}     object with replaced references
                 */
                function repl(obj) {
                  //TODO: fails if obj itself is an DataPath
                  for (var c in obj) {
                    var curr=obj[c];
                    var to=typeof curr;
                    if (to=="object") {
                      cpath.push(c);
                      repl(curr);
                      cpath.pop();
                    } else {
                      if ((to=="string") && (curr.length>2) && (curr[0]=="$") && (curr[curr.length-1]=="$")) {
                        //found data path
                        var dr=new DataPath(curr.substr(1,curr.length-2)); var ts=(+new Date());
                        //set including parent to allow access to the data scope while resolving
                        dr.scope={ ts:ts,
                          root:link,
                          childs:[] //<- add childs here
                          //TODO: childs have to be known at this point, move child array assembly from compose to parse
                        };
                        obj[c]=dr;
                        il.replacements.push({
                          path:dr,
                          location:cpath.slice().push(c)
                        });
                      }
                    }
                  }
                  return obj;
                }

                il.setData(aaddData);
                il.data=repl(il.data);
                il.modifiers={post:[ascript]}
                il.item.parent=root;

                root.itemStr[ai]=il;

                subItemCallback();
              }
            } else {
              //as variable path - evaluated on compose
              root.itemStr[ai]=aid.split(".");
              root.itemStr[ai][0]=root.itemStr[ai][0].substr(1,root.itemStr[ai][0].length); //removed leading $
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
      var scriptName=scriptEnv.getScriptName(link.item);
      var path=root.resolveIdPath();
      var script=new Script();
      var e=script.loadFile(
        path,
        ["itemLink","item","data","environment","childs","module","require","__dirname"]
        ,"ScriptEnvironment"+(scriptName?":"+scriptName:"")
      ); //TODO create Script with scriptEnvironment and add module, require & __dirname args there

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
        root.dataObj=JSON.parse(root.file);
      } catch(e) {
        root.statusFile=new stat.states.items.INVALID_ITEM_FILE({action:"parsing file as json"});
      }
      checkCallback(true);
    }

    function interpretBranch() {
      try {
        root.branchObj=JSON.parse(root.file);

        functions=["get"];
        if (typeof root.branchObj!="object") {
          root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
            action:"json does not match the branch object structure"
          });
        } else {
          if (functions.indexOf(root.branchObj.switch.function)==-1) {
            root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
              action:"no valid branch function",
              "function":root.branchObj.function
            });
          } else {
            if (typeof root.branchObj.branches!="object") {
              root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
                action:"json does not match the branch object structure (object.branches must be an object)"
              });
            } else {
              for (var b in root.branchObj.branches) {
                var branch=root.branchObj.branches[b];
                if (typeof branch!="object") {
                  root.statusFile=new stat.states.items.INVALID_ITEM_FILE({
                    action:"json does not match the branch object structure (object.branches.%branch% must be an object)"
                  });
                  break;
                } else {
                  if (branch.parent) {
                    branchesCount++;

                    branch.parent=itemInterpreter.create(branch.parent,false,function() {
                      branchesCount--;
                      checkCallback();
                    },undefined).item;
                  }
                }
              }
            }
          }
        }

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
      },undefined).item;
      root.staticParent=parent;
    } else {
      parentLoaded=true;
      checkCallback();
    }


    function checkCallback(addItemLoaded) {
      if (addItemLoaded==true) { itemLoaded=true; }
      if ((itemLoaded && parentLoaded) && (branchesCount==0)) {
        callback(link);
      }
    }

    return link;
  },

  /**
   * creates a string representing the item structure
   * @param  {ItemLink}   itemLink     itemLink to parse
   * @param  {Function} callback callback to return if the item is composed
   * @param  {[[Item]]}   childs   chain of item childs (set from parent items)
   * @param  {bool}   asChild  whether or not this item is parsed as child
   * //@param  {[[ItemLink]]}   data     additional data scopes which can be accessed throughout parsing
   * @param  {[Object]} environment environment data scope
   * @async
   * @sync
   */
  compose:function compose(itemLink,callback,childs,asChild,environment) {
    if (typeof childs=="undefined") { childs=[]; }
    if (typeof asChild=="undefined") { asChild=false; }
    if (typeof environment=="undefined") { environment={}; }
    var item=itemLink.item;

    if ((!asChild) && (item.staticParent!=undefined)) {
      //compose parent - this item (if needed) will be composed again as child (=> asChild==true)
      var chLocal=childs.slice();
      chLocal.push(itemLink);
      var link=new ItemLink(item.staticParent);
      itemInterpreter.compose(link,callback,chLocal,false,environment);
    } else {
      //parse item

      if (!itemLink.isValid()) {
        var evtObj={final:itemLink.getStatusString(),itemLink:itemLink,childs:childs,asChild:asChild,environment:environment};
        plugins.trigger("item.compose.post",evtObj);

        callback(evtObj.final);
        return;
      }

      var builder=undefined;
      var builderCallback=function(result) {
        var evtObj={final:result,itemLink:itemLink,childs:childs,asChild:asChild,environment:environment};
        plugins.trigger("item.compose.post",evtObj);

        callback(evtObj.final);
      };

      var types=["static","text","script","data","branch"];
      var builders=[StaticBuilder,TextBuilder,ScriptBuilder,DataBuilder,BranchBuilder];

      var typeIdx=types.indexOf(item.header.type);
      if (typeIdx!=-1) {
        builder=new builders[typeIdx](builderCallback,itemLink,environment,childs,asChild,this);
      } else {
        builder=new FallbackBuilder(builderCallback,itemLink,environment,childs,asChild,this);
      }

      builder.build();
    }
  }
};

(function registerEvents() {
  /**
   * @event item.compose.pre
   * @param {ItemLink} itemLink item link to be composed
   * @param {[ItemLink]} childs array of childs
   * @param {bool} asChild wether or not the item link is parsed as a child
   * @param {object} environment additional data passed for composing
   */
  plugins.registerEvent("item.compose.pre");
  /**
   * @event item.compose.post
   * @param {string} final the parsed string which will be returned
   * @param {ItemLink} itemLink item link to be composed
   * @param {[ItemLink]} childs array of childs
   * @param {bool} asChild wether or not the item link is parsed as a child
   * @param {object} environment additional data passed for composing
   */
  plugins.registerEvent("item.compose.post");
})();


module.exports=itemInterpreter;