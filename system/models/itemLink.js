
Item=require("./item.js");

function ItemLink(item,data,modifiers) {
  this.item=item;
  
  if (data instanceof Item) {
    this.data=data;
    this.dataItem=data.dataObj;
  } else {
    this.data=(typeof data != "undefined")?data:{};
  }

  if (typeof modifiers!="undefined") {
    this.modifiers=modifiers;
  }
}

ItemLink.prototype.item=undefined;
ItemLink.prototype.data={};
ItemLink.prototype.dataItem=undefined; //set if data was loaded from an item
ItemLink.prototype.modifiers={post:[]};

module.exports=ItemLink;