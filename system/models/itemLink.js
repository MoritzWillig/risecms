
Item=require("./item.js");

function ItemLink(item,data,modifiers) {
  this.item=item;
  
  this.setData(data);

  if (typeof modifiers!="undefined") {
    this.modifiers=modifiers;
  }
}

ItemLink.prototype.isValid=function() {
  return ((this.item.isValid()) && ((this.dataItem==undefined) || (this.dataItem.isValid())));
}

ItemLink.prototype.getStatusString=function(printValid) {
  var str="";
  if ((!this.item.isValid()) || printValid) {
    str+=this.item.getStatusString(printValid);
  }

  if (this.dataItem) {
    if ((!this.dataItem.isValid()) || printValid) {
      str+=this.dataItem.getStatusString(printValid);
    }
  } else {
    if (printValid) {
      str+="no data item";
    }
  }

  return str;
}

ItemLink.prototype.setData=function(data) {
  if (data instanceof Item) {
    this.data=data.dataObj;
    this.dataItem=data;
  } else {
    this.data=(typeof data != "undefined")?data:{};
    this.dataItem=undefined;
  }
}

ItemLink.prototype.item=undefined;
ItemLink.prototype.data={};
ItemLink.prototype.dataItem=undefined; //set if data was loaded from an item
ItemLink.prototype.modifiers={post:[]};

module.exports=ItemLink;