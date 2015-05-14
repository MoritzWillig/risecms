var Builder=require("./builder.js");
var PathResolver=require("../../helpers/pathResolver.js");
var ItemLink=require("../../models/itemLink.js");
var DataPath=require("../../models/DataPath.js");
var stat=require("../../../status.js");

var StaticBuilder=function StaticBuilder(callback,itemLink,environment,childs,asChild,itemInterpreter) {
  Builder.apply(this,[callback,itemLink,environment,childs,asChild,itemInterpreter]);

  this.loadingItems=1;
  //this.loadedItems=new Map();
  this.loadedItems={
    data:{},
    set:function(id,val) { this.data[id]=val; },
    get:function(id) { return this.data[id]; }
  }

}

StaticBuilder.prototype=new Builder();

StaticBuilder.prototype.build=function build() {
  var item=this.itemLink.item;


  this.loadingItems+=item.itemStr.length;

  for (var i=0; i<item.itemStr.length; i++) {
    var segment=item.itemStr[i];

    if (typeof segment!="string") {
      if (segment instanceof ItemLink) {
        this._loadItemLink(i,segment);
      } else {
        //is variable
        //lookup data from data scope
        this._loadPath(i,segment);
      }
    } else {
      //is plaintext
      this._loadPlainText(i,segment);
    }
  }

  this.setSegment();
}

StaticBuilder.prototype._loadItemLink=function _loadItemLink(index,itemLink) {
  if (itemLink.item.isValid()) {
    var childsCopy=this.childs.slice();

    var self=this;
    this.itemInterpreter.compose(itemLink,function(itemStr) {
        self.loadedItems.set(index,itemStr);
        self.setSegment();
      },
      childsCopy,false,this.environment
    );
  } else {
    this.loadedItems.set(index,
      itemLink.item.statusHeader.toString()+"\n"+
      itemLink.item.statusFile  .toString()+"\n");
    this.setSegment();
  }
}

StaticBuilder.prototype._loadPlainText=function _loadPlainText(index,text) {
  this.loadedItems.set(index,text);
  this.setSegment();
}

StaticBuilder.prototype._loadPath=function _loadPath(index,path) {
  /*
    child - data delivered from child
    data - inline or item data
    environment - environment data object
    plugins - plugin specific data - planned - to be done
  */
  var self=this;
  var dataPath=new DataPath(path);
  PathResolver.follow(dataPath,this.itemLink,this.childs,this.environment,function(status,data) {
    if (stat.isSuccessfull(status)) {
      var segmentData=undefined;

      switch (typeof data) {
      case "boolean":
        segmentData=data?"true":"false";
        break;
      case "string":
      case "number":
      case "symbol":
        segmentData=data;
        break;
      case "object":
        if (data==null) {
          segmentData=""+data;
        } else {
          segmentData=(new stat.states.items.INVALID_VARIABLE_TYPE({"path":s.join(".")})).toString();
        }
        break;
      case "function": //functions are currently not allowed. use script items
      case "undefined":
        segmentData=(new stat.states.items.UNKNOWN_VARIABLE({"path":s.join(".")})).toString();
        break;
      default:
        segmentData=(new stat.states.items.UNKNOWN_VARIABLE({"path":s.join("."),"msg":"unkown type"})).toString();
        break;
      }
    } else {
      segmentData=status.toString();
    }

    self.loadedItems.set(index,segmentData);
    self.setSegment();
  },false,undefined,this.itemInterpreter);
}

StaticBuilder.prototype.setSegment=function() {
  this.loadingItems--;
  if (this.loadingItems==0) {
    var final="";
    for (var i=0; this.loadedItems.get(i)!=undefined; i++) {
      final+=this.loadedItems.get(i);
    }

    this.callback(final);
  }
}

module.exports=StaticBuilder;