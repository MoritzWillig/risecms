var Builder=require("./builder.js");
var stat=require("../../../status.js");

var FallbackBuilder=function FallbackBuilder(callback,itemLink,environment,childs,asChild) {
  Builder.apply(this,[callback,itemLink,environment,childs,asChild]);
}

FallbackBuilder.prototype=new Builder();

FallbackBuilder.prototype.build=function build() {
  var error=(new stat.states.items.UNKNOWN_RESOURCE_TYPE({
    type:this.itemLink.item.header.type
  })).toString();

  this.callback(error);
}

module.exports=FallbackBuilder;