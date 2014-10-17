

DataPath=function(path) {
  if (path==undefined) {
    this.path=[];
  } else {
    if (typeof path=="string") {
      this.path=path.split(".");
    } else {
      this.path=path;
    }
  }
  this.paths={};
}

/**
 * {boolean scope, * data} object holding path roots which can be accessed by this path
 * @type {Object}
 */
DataPath.prototype.paths={};
/**
 * array holding the sections of the path
 * @type {Array string}
 */
DataPath.prototype.path=[];

/**
 * adds a new root to paths
 * @param {string} name    name of the root
 * @param {array / *} data    any type indexable object (=object or array) if asScope is true
 * @param {boolean} asScope whether or not the data is treated as a scope (a scope object is iterated until an entry holds the next searched path name)
 */
DataPath.prototype.addPath=function(name,data,asScope) {
  if (this.paths[name]!=undefined) {
    throw "path name \""+name+"\" is already defined";
  }

  this.paths[name]={
    scope:asScope,
    data:data
  }
}

DataPath.prototype.removePath=function(name) {
  delete this.paths[name];
}

DataPath.prototype.clearPaths=function() {
  this.paths={};
}

DataPath.prototype.usePaths=function(dataPath) {
  this.paths=dataPath.paths;
}

/**
 * follows a given data path to access scopes
 * @param  {Function} callback        (string/undefined err, * result) callback to be called with the resolved result
 * @param  {Function}   postInterceptor (array path, int pathIndex, {h:{},end:bool} currentValue, DataPath self) function to be called after entering a path
 * @param {Function} preScope (array path, int pathIndex, {h:{},next:{}} currentValue, DataPath self) function to be called before a scope entry is checked
 * @sync
 */
DataPath.prototype.resolve = function(callback,postInterceptor,preScope) {
  /**
   * checks for valid function and calls it with the remaining parameters
   * @param  {Function/*} func if this parameter is a function it will be called or ignored else
   * @param {*} args remaining arguments are passed to func as parameters
   */
  function assertCall(func) {
    if (func) {
      var args=Array.prototype.slice.call(arguments,1);
      func.apply(this,args);
    }
  }
  var path=this.path;

  if (path.length==0) {
    callback("path root is unknown (path length is 0)");
    return;
  }

  //find root
  var i=0;
  var curr={h:this.paths[path[i]]};
  if (curr.h==undefined) {
    callback("root "+path[i]+" does not exist");
    return;
  }

  if (curr.h.scope) {
    if (path.length<2) {
      callback("path pointed to a scope but got no second path section");
      return;
    } else {
      //accept first section
      curr.h=curr.h.data;
      assertCall(postInterceptor,path,i,curr,this);
      if (curr.end==true) {
        callback(undefined,curr.h);
        return;
      }
      
      //move to second and search matching scope
      i++;
      var found=false;
      for (var j in curr.h) {
        curr.next=curr.h[j];
        assertCall(preScope,path,i,curr,this);
        if (curr.next[path[i]]!=undefined) {
          curr.h=curr.next;
          curr.next=undefined;
          assertCall(postInterceptor,path,i,curr,this);
          if (curr.end==true) {
            callback(undefined,curr.h);
            return;
          }
          found=true;
          break;
        }
      }

      if (!found) {
        callback("found no matching scope");
        return;
      }
    }
  } else {
    //is normal root; set current data
    curr.h=curr.h.data;
    assertCall(postInterceptor,path,i,curr,this);
    if (curr.end==true) {
      callback(undefined,curr.h);
      return;
    }
    i++;
  }

  //follow path in found root (& scope)
  for (; ((i<path.length) && (curr.h!=undefined) && (curr.end!=true)); i++) {
    curr.h=curr.h[path[i]];
    assertCall(postInterceptor,path,i,curr,this);
  }
  
  //check if path was not completely found
  if (((curr.h!=undefined) && (i==path.length)) || (curr.end==true)) {
    callback(undefined,curr.h);
  } else {
    callback("path does not exist");
  }
};

DataPath.prototype.toString=function() {
  return this.path.join(".");
}

module.exports=DataPath;