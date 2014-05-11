
fpath=require("path");

/**
 * module for storing absolute paths within a project
 * 
**/

var roots={};

fsanchor={
  set:function(name,path) {
    roots[name]=fpath.resolve(path);
    console.log(name,path,roots[name]);
  },
  resolve:function(path,root) {
    var res=fpath.normalize(roots[root]+"/"+path);
    //console.log("resolving",root,path,"->",res);
    return res;
  }
}

module.exports=fsanchor;