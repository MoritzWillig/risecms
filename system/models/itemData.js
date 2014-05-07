
Scope=function() {}
Scope.prototype={
  data:{},
  /**
   * looks up value by name
  **/
  get:function(name) {
    var d=data[name];
    return d?d.scope.data[name].ref.data:undefined;
  },
  /**
   * sets value by name
  **/
  set:function(name,data) {
    if (!this.data[name]) {
      this.add(name,scope);
    }

    this.data[name].ref={data:data}; //embed data into object, to make sure it is passed by reference

    ALL PARENTS HAVE TO BE UPDATED! (maybe save all parents in this object?)
  },
  /**
   * removes value from scope
  **/
  delete:function(name) {
    //check if value exists in this scope

    //remove value

    //update parents
  }
  /**
   * propagates scope reference into this scope
  **/
  add:function(name,scope) {
    var chainItem={scope:scope,child:undefined};
    if (var i=this.data[name]) {
      chainItem.child=i;
    }
    this.data[name]=chainItem;
  },
  /**
   * removes scope reference from this scope
  **/
  remove:function(name,scope) {
    var p=this.data[name];
    var lp; //parent

    while (p) {
      if (p.scope==scope) {
        if (lp) {
          lp.child=p.child; //remove current item from chain
        } else {
          delete data[pname]; //no parent -> delete entry
        }
        return;
      }

      p=p.parent; //check next chain item
    }
  },
  /**
   * pushes scope references into this scope
  **/
  push:function(scope) {
    for (var d in scope.data) {
      this.add(d,scope);
    }
  },
  /**
   * removes scope references from this scope
  **/
  pop:function(scope) {
    for (var d in scope.data) {
      this.remove(d,scope);
    }
  }
}


module.exports=itemData;