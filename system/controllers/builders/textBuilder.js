var Builder=require("./builder.js");
var stat=require("../../../status.js");

var TextBuilder=function(callback,itemLink,environment,childs,asChild) {
  Builder.apply(this,[callback,itemLink,environment,childs,asChild]);
}

TextBuilder.prototype=new Builder();

TextBuilder.prototype.build=function build() {
  this.callback(this.itemLink.item.itemStr.join(""));
}

module.exports=TextBuilder;