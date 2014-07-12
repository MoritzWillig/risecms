Item=require("../models/item.js");
ItemLink=require("../models/itemLink.js");
findParenthesis=require("../helpers/parenthesis.js").findParenthesis;
findNSurr=require("../helpers/parenthesis.js").findNSurr;


itemInterpreter={
  create:function(id,asPath,callback,data) { console.log("loading",id);
    if (typeof callback=="undefined") { callback=function() {}; }

    var root=new Item(id,asPath);
    root.loadHeader(cbInterpret);
    
    var itemLoaded=false;
    var parentLoaded=false;

    function cbInterpret() {
      if (!root.isValid()) {
        //we did not get a header to determine if a parent exists
        parentLoaded=true;
        checkCallback(true);
        return;
      }

      id=root.header.id;
      switch (root.header.type) {
        case "static":
          root.loadFile(cbFile(interpretStatic));
          break;
        case "text":
          root.loadFile(cbFile(interpretText));
          break;
        case "script":
          cbFile(interpretScript)();
          break;
        case "data":
          root.loadFile(cbFile(interpretData));
          break;
        default:
          root.statusHeader=new stat.states.item.UNKNOWN_RESOURCE_TYPE();
          checkCallback(true);
          break;
      }

      function cbFile(next) {
        root.itemStr=[]
        root.dataObj=undefined;

        return function(item) {
          if (!root.isValid()) {
            checkCallback(true);
            return;
          }

          next();
        };
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
            }

            //extract data
            idx=findNSurr(s,"|",0,"\"");
            if (idx!=-1) {
              data=s.substr(last,idx);
              s=s.substr(idx+1,s.length);
            }

            //extract script
            if (s.length!=0) {
              script=s;
            }

            if (!isInline(id)) {
              //parse as item
              subItemCt++;
              
              //load sub item
              root.itemStr[i]=new ItemLink(
                itemInterpreter.create(id,false,subItemCallback),
                data,
                {post:[script]}
              );
              
              root.itemStr[i].item.parent=root;
            } else {
              //as variable path - evaluated on compose
              root.itemStr[i]=s.split(".");
              root.itemStr[i][0]=root.itemStr[i][0].substr(1,root.itemStr[i][0].length);
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
        var script=require(path);
        try {
          script(root,function() {
            checkCallback(true);
          });
        } catch (e) {
          root.statusFile=new stat.states.item.INVALID_ITEM_FILE({action:"executing as script"});
          checkCallback(true);
        }
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
   * @param  {Item}   item     item to parse
   * @param  {Function} callback callback to return if the item is composed
   * @param  {[[Item]]}   childs   chain of item childs (set from parent items)
   * @param  {bool}   asChild  whether or not this item is parsed as child
   * //@param  {[[ItemLink]]}   data     additional data scopes which can be accessed throughout parsing
   * @param  {[Object]} global global data scope
   */
  compose:function(item,callback,childs,asChild,global) {
    if (typeof childs=="undefined") { childs=[]; }
    if (typeof asChild=="undefined") { asChild=false; }
    if (typeof global=="undefined") { global={}; }
    
    if ((!asChild) && (item.staticParent!=undefined)) {
      //compose parent - this item (if needed) will be composed again as child (=> asChild==true)
      childs.push(item);
      itemInterpreter.compose(item.staticParent,callback,childs,false,global);
      childs.pop();
    } else {
      //parse item normally
      
      switch (item.header.type) {
      case "static":
        
        break;
      case "text":
        callback(item.itemStr[0]);
        break;
      case "script":
        item.script.trigger("compose",item);
        break;
      case "data":
        root.loadFile(cbFile(interpretData));
        break;
      default:
        root.statusHeader=new stat.states.item.UNKNOWN_RESOURCE_TYPE();
        checkCallback(true);
        break;
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

              itemInterpreter.compose(s.item,(function(i) { return function(itemStr) {
                cs[i]=itemStr;
                itemCb();
              }; })(i),chLocal,false,global);
            } else {
              cs[i]=
                s.item.statusHeader.toString()+"\n"+
                s.item.statusFile  .toString()+"\n";
              itemCb();
            }
            
          } else {
            //is variable
            //lookup data from data scope
            cs[i]="%%%VARIABLE%%%";
            /*
            child - data delivered from child
            data - inline or item data
            global - global data object
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
                  
                  cs[i]=itemInterpreter.compose(
                    childs[childs.length-1],itemCb,
                    chLocal,true,global
                    );
                }
                break;
              case "data":
                if (typeof item.dataObj[v[1]]!="undefined") {
                  //read from local data scope
                  r=item.dataObj;
                } else {
                  //search child tree
                  for (var c=childs.length-1; c>=0; c--) {
                    if (childs[c][v[1]]) {
                      r=childs[c];
                      break;
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
                r=global;
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
                default:
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
          callback(final);
        }
      }
    }
  }
};

module.exports=itemInterpreter;