var Builder=require("./builder.js");
var stat=require("../../../status.js");
var scriptEnv=new (require("../scriptEnvironment.js"))();

var ScriptBuilder=function ScriptBuilder(callback,itemLink,environment,childs,asChild) {
  Builder.apply(this,[callback,itemLink,environment,childs,asChild]);
}

ScriptBuilder.prototype=new Builder();

ScriptBuilder.prototype.build=function build() {
  var childsCopy=this.childs.slice();
  var item=this.itemLink.item;

  var scope=[
    this.itemLink,
    this.itemLink.item,
    this.itemLink.data,
    this.environment,
    childsCopy
  ];

  var self=this;
  scriptEnv.run(item.script,scope,function(result) {
    self._callback(result);
  });
}

ScriptBuilder.prototype._callback=function _callback(result) {
  this.callback(result);
}

module.exports=ScriptBuilder;