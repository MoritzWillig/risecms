
DebugWindowItem=function DebugWindowItem(id,name) {
  this.id=id;
  this.name=(name==undefined)?"":name;
  this.tab=undefined;

  this.gui=debugWindow.gui.elements.div.clone().addClass("editScreenSourceEntry").text(this.id+" | "+this.name);
}

//TODO change data & header
DebugWindowTab=function DebugWindowTab(item) {
  this._cache={
    status:undefined,
    description:undefined,

    data:undefined,
    header:undefined,

    queried:false,
    callbackQueue:[]
  };

  this.item=item;
  if (!this.item) {
    this._cache.status=200;
    this._cache.description="ok";
    this.data="";
    this.header={}
    for (var i in editorAPI.headerColumns) {
      this.header[editorAPI.headerColumns[i]]=undefined;
    }
  }
};

DebugWindowTab.prototype.setActive=function(state) {
  //TODO add tab gui
};

DebugWindowTab.prototype.getData=function(callback,forceReload) {
  var self=this;
  if ((!this.isValid()) || forceReload) {
    this._updateCache(function() {
      callback(self._cache.data);
    });
  } else {
    callback(self._cache.data);
  }
};

DebugWindowTab.prototype.getHeader=function(callback,forceReload) {
  var self=this;
  if ((!this.isValid()) || forceReload) {
    this._updateCache(function() {
      callback(self._cache.header);
    });
  } else {
    callback(self._cache.header);
  }
};

DebugWindowTab.prototype.setData=function(data) {
  this._cache.data=data;
}

DebugWindowTab.prototype.setHeader=function(header) {
  this._cache.header=header;
}

DebugWindowTab.prototype._updateCache=function(callback) {
  var self=this;
  
  this._cache.callbackQueue.push(callback);

  if (this.item) {
    if (this._cache.queried==false) {
      this._cache.queried=true;
    
      editorAPI.getItem(this.item.id,function(status,data) {
        self._cache.status=(status==undefined)?200:status;
        self._cache.description=data.description;
        self._cache.data=data.data;
        self._cache.header=data.header;

        self._finishCacheUpdate();
      });
    }
  } else {
    //local data
    self._finishCacheUpdate();
  }
};

DebugWindowTab.prototype._finishCacheUpdate=function() {
  this._cache.queried=false;
  var queue=this._cache.callbackQueue;
  this._cache.callbackQueue=[];
  
  for (var i in queue) {
    queue[i].apply(this);
  }
};

DebugWindowTab.prototype.isValid=function() {
  return (this._cache.status==200);
};

