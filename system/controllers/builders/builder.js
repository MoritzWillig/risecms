var Builder=function Builder(callback,itemLink,environment,childs,asChild,itemInterpreter) {
  this.callback=callback;
  this.itemLink=itemLink;
  this.environment=environment;
  this.childs=childs;
  this.asChild=asChild;
  this.itemInterpreter=itemInterpreter;
}

Builder.prototype.build=function build() {
  throw new Error("not implemented");
}


module.exports=Builder;