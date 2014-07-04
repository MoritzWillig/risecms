
function ItemLink(item,data,modifiers) {
  this.item=item;
  this.data=(typeof data != "undefined")?data:{};
  if (typeof modifiers!="undefined") {
    this.modifiers=modifiers;
  }
}

ItemLink.prototype.item=undefined;
ItemLink.prototype.data={};
ItemLink.prototype.modifiers={post:[]};

module.exports=ItemLink;