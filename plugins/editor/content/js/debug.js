
var enclosingTags=true;

notificationForm={
  gui:undefined,
  queue:[],
  updateQueue:function() {
    var self=this;
    var ts=this.getTimestamp();
    var top=this.config.windowTopSpacing;

    //update queue
    for (var i in this.queue) {
      var element=this.queue[i];
      
      //update transparency
      var diff=ts-element.timestamp;

      if (diff>=this.config.fadeAfter+this.config.fadeDurration) {
        this.removeElement(i);
        continue;
      }

      var transparency=0;
      if (diff>this.config.fadeAfter) {
        transparency=(diff-this.config.fadeAfter)/this.config.fadeDurration;
      }
      this.gui.css("opacity",1-transparency); //add correct css name

      //update position
      element.gui.css("top",top+this.config.elementSpacing);
      top+=element.gui.height()+this.config.elementSpacing;
    }

    //setup/clear timer
    if (this._timer==undefined) {
      if (this.queue.length!=0) {
        this._timer=setInterval(function() {
          self.updateQueue();
        },10);
      }
    } else {
      if (this.queue.length==0) {
        clearInterval(this._timer);
      }
    }
  },
  config: {
    fadeAfter:2000,
    fadeDurration:1000,
    mouseMoveReset:true,
    mouseClickRemove:true,
    windowTopSpacing:10,
    elementSpacing:5
  },
  getTimestamp:function() { return (+new Date()) },
  display:function(message) {
    var self=this;
    var element={
      gui:$(document.createElement("div")).addClass("displayElement")
        .text(message).appendTo(this.gui).click(function() {
        if (self.config.mouseClickRemove) {
          self.removeElement(self.queue.indexOf(element));
        }
      }).mousemove(function() {
        if (self.config.mouseMoveReset) {
          var ts=self.getTimestamp();
          for (var i in self.queue) {
            self.queue[i].timestamp=ts;
          }
          self.updateQueue();
        }
      }),
      timestamp:this.getTimestamp()
    };
    
    this.queue.push(element);
    this.updateQueue();
  },
  removeElement:function(index) {
    var element=this.queue.splice(index,1)[0];
    element.gui.remove();
    this.updateQueue();
  },
  _timer:undefined,
  _setup:function() {
    this.gui=$(document.createElement("div")).addClass("displayForm").appendTo($("body"));
  }
}

function display(str) {
  console.log(str);
  notificationForm.display(str);
}

(function() {
  $(document).ready(function() {
    notificationForm._setup();
  });
})();


function findOrigin(node) {
  var opened=1;

  if (enclosingTags) {
    //return first parent which is a debug tag
    var c=node;
    while (c.parentNode) {
      if (hasClass(c,"riseCMSDebug")) {
        //prefer data ids before layout ids
        var id=c.dataset.dataid?c.dataset.dataid:c.dataset.id;
        return { id:id, tag:c.dataset.tag, layoutId:c.dataset.id, dataId:c.dataset.dataid };
      }
      c=c.parentNode;
    }
  } else {
    nodes=document.getElementsByClassName("riseCMSDebug");
    //console.log(nodes.length,"debug elements");
    
    for (var i=0; i<nodes.length; i++) { var n=nodes[i];
      //ignore all elements before focused node
      var res=n.compareDocumentPosition(node);
      if (!(
        (!(res&document.DOCUMENT_POSITION_CONTAINED_BY)) &&
        ( (res&document.DOCUMENT_POSITION_PRECEDING   ))
        )) { continue; }
      
      //next closing element with no opening tag is parent
      var id=n.dataset.dataid?n.dataset.dataid:n.dataset.id;
      var debugData={ id:id, tag:n.dataset.tag, layoutId:n.dataset.id, dataId:n.dataset.dataid };
      //console.log("->",debugData.id,debugData.tag);

      if (debugData.tag=="open") {
        opened++;
      } else {
        opened--;

        if (opened==0) {
          return debugData;
        }
      }
    }
  }
  return {id:null,tag:null};
}


function isEditorClean() {
  return ((editor.getSession().getUndoManager().isClean()) && (!changedHeaderValue));
}

function saveNewItem(header, data) {
  $.ajax(riseCMSHost+"/plugins/editor/new",{
    type:"POST",
    dataType:"json",
    data:{
      header:(typeof header=="undefined")?undefined:JSON.stringify(header),
      data:  data
    },
    success:function(data,testStatus,jqXHR) {
      if (data.code==200) {
        display("ok - loading item now");
        loadEntry(data.id);
        addId(data.id);
      } else {
        display("could not save item");
      }
    },
    error:function() {
      display("can not connect to server");
    }
  });
}

editorAPI={
  headerColumns :["id" ,"section","path","name","uri_name","title","parent","type","created"],
  headerEditable:[false,true     ,true  ,true  ,true      ,true   ,true    ,true  ,false    ],

  get:function(action,callback) {
    $.ajax(riseCMSHost+"/plugins/editor/"+action,{
      type:"GET",
      dataType:"json",
      cache:false,
      success:function(data,testStatus,jqXHR) {
        if (data.code!=200) {
          callback("api error",data);
        } else {
          callback(undefined,data);
        }
      },
      error:function() {
        callback("request failed",{
          description:"ajax error",
          data:undefined,
          header:[]
        });
      }
    })    
  },
  getItem:function(id,callback) {
    this.get(id+"/get",callback);
  },
  getContent:function(path,callback) {
    this.get("content/get/"+path,callback);
  },
  getContentDir:function(callback) {
    this.get("content/list/",callback);
  },
  set:function(action,data,callback) {
    $.ajax(riseCMSHost+"/plugins/editor/"+action,{
      type:"POST",
      dataType:"json",
      data:data,
      success:function(data,testStatus,jqXHR) {
        if (data.code==200) {
          callback(undefined,data);
        } else {
          callback("could not save content",data);
        }
      },
      error:function() {
        callback("request failed");
      }
    });
  },
  newItem:function(path,data,callback) {
    throw "not implemented"
  },
  setItem:function(id,data,header,callback) {
    var headerSend=undefined;
    if (header!=undefined) {
      //filter read-only columns
      headerSend={};
      for (var i in this.headerEditable) {
        if (this.headerEditable[i]==true) {
          headerSend[this.headerColumns[i]]=header[this.headerColumns[i]];
        }
      }
    }

    this.set(id+"/set/",{
      header:(header==undefined)?undefined:JSON.stringify(headerSend),
      data: (data==undefined)?undefined:data
    },callback);
  },
  setContent:function(path,data,callback) {
    this.set("content/set/"+path,{
      data: (data==undefined)?undefined:data
    },callback);
  },
  getAppliedItems:function() {
    var items=[];
    var nodes=document.getElementsByClassName("riseCMSDebug");

    for (var i=0; i<nodes.length; i++) {
      items.push(new DebugWindowItem(nodes[i].dataset.id,nodes[i].dataset.name));
    }

    return items;
  }
};


(function() {
  $(window).ready(function() {
    editorAPI.getContentDir(function(status,data) {
      if (status) {
        display("error: "+status);
        return;
      }

      debugWindow.addContent(data.dir);
    });

    var items=editorAPI.getAppliedItems();
    for (var i in items) {
      debugWindow.setWindowItem(items[i]);
    }
    
    $(document).dblclick(function() {
      debugWindow.setVisibility(true);

      /*
      var t=e.explicitOriginalTarget?e.explicitOriginalTarget:e.target;
      var data=findOrigin(t);
      console.log("found origin ",t," at id ",data.id);
      loadEntry(data.id);
      */
    });
  });
})()