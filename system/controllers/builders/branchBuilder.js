var Builder=require("./builder.js");
var stat=require("../../../status.js");
var ItemLink=require("../../models/itemLink.js");

var BranchBuilder=function BranchBuilder(callback,itemLink,environment,childs,asChild,itemInterpreter) {
  Builder.apply(this,[callback,itemLink,environment,childs,asChild,itemInterpreter]);
}

BranchBuilder.prototype=new Builder();

BranchBuilder.prototype.build=function build() {
  var functions={
    "get":function branchGetFunc(builder,switchObj,branch,branchName) {
      if (builder.environment.req.query[switchObj.name]==branchName) {
        return true;
      }
    }
  };
  var branchObj=this.itemLink.item.branchObj;

  var branchFunc;
  if (functions[branchObj.switch.function]) {
    branchFunc=functions[branchObj.switch.function];
  } else {
    this.callback((new stat.states.items.branch.UNKNOWN_FUNCTION({
      "function":branchObj.switch.function
    })).toString());
    return;
  }

  var branch;
  for (i in branchObj.branches) {
    if (branchFunc(this,branchObj.switch,branchObj.branches[i],i)) {
      branch=branchObj.branches[i];
      break;
    }
  }

  if (branch==undefined) {
    if (branchObj.branches["default"]!=undefined) {
      branch=branchObj.branches["default"];
    } else {
      this.callback((new stat.states.items.branch.NO_BRANCH({"branding":branding})).toString());
      return;
    }
  }

  if (branch.parent) {
    //taken from item interpreter compose. but we skip the branch item itself and set a new parent
    var chLocal=this.childs.slice();
    //chLocal.push(this.itemLink); <- do not push - skip branch item
    var link=new ItemLink(branch.parent);
    this.itemInterpreter.compose(link,this.callback,chLocal,false,this.environment);
  } else {
    if (branch.childOnly) {
      //item is parsed without parent
      var chLocal=this.childs.slice();
      if (chLocal!=0) {
        var child=chLocal.pop();
        this.itemInterpreter.compose(child,this.callback,chLocal,true,this.environment);
      } else {
        //error - branch was called directly and therefore has no childs
        this.callback((new stat.states.items.branch.NO_CHILDS({"branding":branding})).toString());
        return;
      }
    } else {
      //error - branch support is currently limited to setting another parent
      this.callback((new stat.states.items.branch.NO_OPTION({"branding":branding})).toString());
      return;
    }
  }
}

module.exports=BranchBuilder;