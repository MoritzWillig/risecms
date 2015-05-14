
var enclosingTags=true;

function display(str) {
  console.log(str);
  notificationForm.display(str);
}


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

editorAPI={
  headerColumns :["id" ,"section","path"  ,"name"  ,"uri_name","title" ,"parent","type"  ,"created"  ],
  headerEditable:[false,true     ,true    ,true    ,true      ,true    ,true    ,true    ,false      ],
  headerType    :["int","string" ,"string","string","string"  ,"string","string","string","timestamp"],

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
    });
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
  newItem:function(data,header,callback) {
    if (header==undefined) {
      throw new Error("no header was given");
    }

    var headerSend=undefined;
    //filter read-only columns
    headerSend={};
    for (var i in this.headerEditable) {
      if (this.headerEditable[i]==true) {
        headerSend[this.headerColumns[i]]=header[this.headerColumns[i]];
      }
    }

    this.set("new/",{
      header:JSON.stringify(headerSend),
      data: (data==undefined)?undefined:data
    },callback);
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
  query:function(action,query,callback) {
    $.ajax(riseCMSHost+"/plugins/editor/query/"+action,{
      type:"GET",
      dataType:"json",
      cache:false,
      data:{queryHeader:JSON.stringify(query)},
      success:function(data,testStatus,jqXHR) {
        if (data.code!=200) {
          callback("api error",data);
        } else {
          callback(undefined,data);
        }
      },
      error:function() {
        callback("request failed",{
          description:"ajax error"
        });
      }
    });
  },
  queryItem:function(data,callback) {
    this.query("item",data,callback);
  },
  queryContent:function(data,callback) {
    this.query("content",data,callback);
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