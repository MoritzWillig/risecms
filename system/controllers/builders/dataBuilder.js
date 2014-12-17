var Builder=require("./builder.js");
var stat=require("../../../status.js");

var DataBuilder=function(callback,itemLink,environment,childs,asChild) {
  Builder.apply(this,[callback,itemLink,environment,childs,asChild]);
}

DataBuilder.prototype=new Builder();

DataBuilder.prototype.build=function build() {
  var error=(new stat.states.items.INVALID_ITEM_FILE({
    type:this.itemLink.item.header.type
  })).toString();

  this.callback(error);
}

module.exports=DataBuilder;