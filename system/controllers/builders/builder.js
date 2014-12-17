var Builder=function Builder(callback,itemLink,environment,childs,asChild) {
  this.callback=callback;
  this.itemLink=itemLink;
  this.environment=environment;
  this.childs=childs;
  this.asChild=asChild;
}

Builder.prototype.build=function build() {
  throw new Error("not implemented");
}


module.exports=Builder;