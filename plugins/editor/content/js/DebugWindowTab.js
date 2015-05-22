
DebugWindowItem=function DebugWindowItem(id,name) {
  this.id=id;
  this.name=(name==undefined)?"":name;
  this.tab=undefined;

  this.gui=debugWindow.gui.elements.div.clone().addClass("editScreenSourceEntry").text(this.getName());
}

DebugWindowItem.prototype.getName=function() {
  return this.id+(this.name?" | "+this.name:"");
}

DebugWindowTab=function DebugWindowTab(item,onNewItem) {
  this._cache={
    status:undefined,
    description:undefined,

    data:undefined,
    header:undefined,

    queried:false,
    callbackQueue:[]
  };

  this.onNewItem=onNewItem;

  this.item=item;
  if (!this.item) {
    this._cache.status=200;
    this._cache.description="ok";
    this._cache.data="";
    this._cache.header={};
    for (var i in editorAPI.headerColumns) {
      this._cache.header[editorAPI.headerColumns[i]]=undefined;
    }
  }
};

DebugWindowTab.prototype.setItem=function(item) {
  this.item=item;
  this._cache.header.id=this.item.id;
}

DebugWindowTab.prototype.getTabLabel=function() {
  return (this.item)?this.item.getName():undefined;
}

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
  for (var i in header) {
    if (i!="id") {
      this._cache.header[i]=header[i];
    }
  }
}

DebugWindowTab.prototype.save=function(callback) {
  self=this;
  self.getData(function(data) {
    self.getHeader(function(header) {
      if (self.isValid() && (data!=undefined) && (header!=undefined)) {
        if (self.item) {
          editorAPI.setItem(self.item.id,data,header,function(status,data) {
            callback(status);
          });
        } else {
          editorAPI.newItem(data,header,function(status,data) {
            callback(status);

            if (!status) {
              self.onNewItem(data.id);
            }
          });
        }
      } else {
        callback("item is not valid");
      }
    });
  });
}

DebugWindowTab.prototype._updateCache=function(callback) {
  var self=this;

  this._cache.callbackQueue.push(callback);

  if (this.item) {
    if (this._cache.queried==false) {
      this._cache.queried=true;

      editorAPI.getItem(this.item.id,function(status,data) {
        self._cache.status=(status==undefined)?200:status;
        self._cache.description=data.error||data.description||"";
        self._cache.data=data.data;
        self._cache.header=data.header;

        self._finishCacheUpdate();
      });
    }
  } else {
    //FIXME ??
    asdf
    asdf
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

DebugWindowTab.prototype.getStatusString=function() {
  return (this.isValid())?"":this._cache.description;
}