Item=require("../models/item.js");
ItemLink=require("../models/itemLink.js");
findParenthesis=require("../helpers/parenthesis.js").findParenthesis;
findNSurr=require("../helpers/parenthesis.js").findNSurr;

/**
 * checks if the given parameter can be interpreted as a number
 * @param  {*} x parameter to be checked
 * @return {boolean}   wheter or not the parameter is a number
 */
function checkNumber(x) {
  return !isNaN(+x);
}

itemInterpreter={
  create:function(id,asPath,callback,data) {
    if (typeof callback=="undefined") { callback=function() {}; }

    var root=new Item(id,asPath);
    root.loadHeader(cbInterpret);

    function cbInterpret() {
      if (!root.isValid()) {
        callback(root);
        return;
      }

      var id=root.header.id;
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
          callback(root);
          break;
      }

      function cbFile(next) {
        root.itemStr=[]
        root.dataObj=undefined;

        return function(item) {
          if (!root.isValid()) {
            callback(root);
            return;
          }

          next();
        };
      }

      function interpretText() {
        root.itemStr=[root.file];
        callback(root);
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
          callback(root);
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
                itemInterpreter.create(id,asPath,subItemCallback),
                data,
                {post:[script]}
              );
              
              root.itemStr[i].item.parent=root;
            } else {
              //as variable path - evaluated on compose
              root.itemStr[i]=s.split(".");
              i--;
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
              callback(root);
            }
          }

        }
      }

      function interpretScript() {
        var path=root.resolveIdPath();
        var script=require(path);
        try {
          script(root,callback);
        } catch (e) {
          root.statusFile=new stat.states.item.INVALID_ITEM_FILE({action:"executing as script"});
          callback(root);
        }
      }

      function interpretData() {
        try {
          root.dataObj=JSON.parse(data);
          root.statusFile=new stat.states.items.OK();
        } catch(e) {
          root.statusFile=new stat.states.items.INVALID_ITEM_FILE({action:"parsing file as json"});
        }
        callback(root);
      }
    }

    return root;
  },

  compose:function(item,callback) {
    var cs={};
    var itemsCt=1;
    for (var i=0; i<item.itemStr.length; i++) {
      var s=item.itemStr[i];

      itemsCt++;
      if (typeof s!="string") {
        if (s instanceof ItemLink) {
          cs[i]="%%%ITEM%%%"; itemCb();

          /*if (s.item.isValid()) {
            //TODO: apply data from ItemLink
            itemInterpreter.compose(s.item,(function(i) { return function(itemStr) {
              cs[i]=itemStr;
              itemCb();
            }; })(i),s.data);
          } else {
            cs[i]=
              s.item.statusHeader.toString()+"\n"+
              s.item.statusFile  .toString()+"\n";
            itemCb();
          }
          */
        } else {
          //is variable
          //lookup data from data scope
          cs[i]="%%%VARIABLE%%%";
          itemCb();
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

};

module.exports=itemInterpreter;