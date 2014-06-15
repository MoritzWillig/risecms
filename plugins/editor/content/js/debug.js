
var enclosingTags=true;

var displayForm;
function display(str) {
  console.log(str);

  if (!displayForm) {
    displayForm=$("<div id='displayForm'></div>")
    .click(function() {
      $(displayForm).remove();
      displayForm=undefined;
    });
    $("body").append(displayForm);
  } else {
    displayForm.append("<hr>");
  }

  displayForm.append(str);
}

function hasClass(element, cls) {
  if (element.classList) {
    return element.classList.contains(cls);
  } else {
    return ((' '+element.className+' ').indexOf(' '+cls+' ')!=-1);
  }
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


document.body.ondblclick=function(e,x) {
  if (!editor) {
    var t=e.explicitOriginalTarget?e.explicitOriginalTarget:e.target;
    var data=findOrigin(t);
    console.log("found origin ",t," at id ",data.id);

    loadEntry(data.id);
  }
}

var ids=[];
var idSE=[];
var lastInsertSE;
function addId(id,name) {
  var srcs=document.getElementById("ess");
  var idx=ids.indexOf(id);
  if (idx==-1) {
    var item=$("<div class='editScreenSourceEntry'>"+id+(name?" - "+name:"")+"</div>");
    item.click(function() {
      loadEntry(id);
    });

    if (!lastInsertSE) {
      $(srcs).append(item);
    } else {
      $(item).insertAfter(lastInsertSE);
    }
    lastInsertSE=item;
      
    ids.push(id);
    idSE.push(item);

    return item;
  } else {
    return idSE[idx];
  }
}

var editor;
function openEditor() {
  $("body").addClass("editorModal");

  if (editor) { return; }
  $("body").append($("\
    <div id='editScreenBg'>\
      <div id='editScreenWindow'>\
        <div id='editScreenTitlebar'>\
          <div id='editScreenClose' onclick='closeEditor()'>x</div>\
        </div>\
        <div id='editScreenSources'>\
          <div id='ess'></div>\
          <div id='esc'></div>\
        </div>\
        <div id='editScreenHeaderWrapper'>\
          <table id='editScreenHeader'>\
            <tr id='editSCreenTitleDesc'>\
              <td></td>\
              <td>id</td>\
              <td>section</td>\
              <td>path</td>\
              <td>name</td>\
              <td>uri_name</td>\
              <td>title</td>\
              <td>parent</td>\
              <td>type</td>\
              <td>created</td>\
            </tr>\
            <tr>\
              <td><button onclick='saveCurrent(false,true)'>save header</button></td>\
              <td><input class='editScreenHead' id='editScreenHead_id' enabled='false'></td>\
              <td><input class='editScreenHead' id='editScreenHead_section'></td>\
              <td><input class='editScreenHead' id='editScreenHead_path'></td>\
              <td><input class='editScreenHead' id='editScreenHead_name'></td>\
              <td><input class='editScreenHead' id='editScreenHead_uri_name'></td>\
              <td><input class='editScreenHead' id='editScreenHead_title'></td>\
              <td><input class='editScreenHead' id='editScreenHead_parent'></td>\
              <td><input class='editScreenHead' id='editScreenHead_type'></td>\
              <td><input class='editScreenHead' id='editScreenHead_created' enabled='false'></td>\
            </tr>\
          </table>\
        </div>\
        <div id='editScreen'></div>\
        <div id='editScreenFooter'>\
          <button onclick='saveCurrent(true,false)'>save content</button>\
          <button onclick='saveCurrent()'>save all</button>\
        </div>\
      </div>\
    </div>\
  "));

  editor=ace.edit("editScreen");
  editor.setTheme("ace/theme/kr_theme");
  
  editor.getSession().setTabSize(2);
  editor.getSession().setUseSoftTabs(true);
  editor.getSession().setUseWrapMode(false);
  editor.setHighlightActiveLine(false);
  editor.setValue("");

  var nodes=document.getElementsByClassName("riseCMSDebug");
  var srcs=document.getElementById("ess");

  for (var i=0; i<nodes.length; i++) {
    var src=nodes[i].dataset;
    addId(src.id,src.name);
    if (src.dataid) {
      addId(src.dataid);
    }
  }
  
  var load=$("<div class='editScreenSourceEntry'>\
    <input></input>\
    <button>load</button>\
  </div>");
  $(load.children()[1]).click(function() {
    var id=$(load.children()[0]).val();
    var item=addId(id);
    $(item).click();
  });
  $(srcs).append(load);

  if (riseCMSEditCrNew!=false) {
    var cradd=$("<div class='editScreenSourceEntry'>create this page</div>");
    cradd.click(function() {
      loadEntry(undefined);
      $("#editScreenHead_path").val(riseCMSEditCrNew);
    });
    $(srcs).append(cradd);
  }

  var add=$("<div class='editScreenSourceEntry'>+</div>");
  add.click(function() {
    loadEntry(undefined);
  });
  $(srcs).append(add);

  var srcc=document.getElementById("esc");
  $.ajax(riseCMSHost+"/plugins/editor/content/list",{
    type:"GET",
    dataType:"json",
    cache:false,
    success:function(data,testStatus,jqXHR) {
      if (data.code!=200) {
        display("Error "+data.code+" - "+data.desc);
        return;
      }
      //$(srcc).text(JSON.stringify(data.dir));
      //fill content
      for (var d in data.dir) {
        var n=data.dir[d];
        if (n=="file") {
          addContFile(d,srcc,d);
        } else {
          addContNode(d,srcc,d,n);
        }
      }
    },
    error:function() {
      display("Can not connect to server");
    }
  });
}

function addContNode(name,parent,path,dir) {
  var node=$("\
    <div class='srcContNode'>\
      <div class='scrContEl srcContNodeName'></div>\
      <div class='srcContNodeSub'></div>\
    </div>");
  $(".srcContNodeName",node).text(name);
  var sub=$(".srcContNodeSub",node);

  for (var d in dir) {
    var n=dir[d];
    if (n=="file") {
      addContFile(d,sub,path+"/"+d);
    } else {
      addContNode(d,sub,path+"/"+d,n);
    }
  }
  $(parent).append(node);
}

function addContFile(name,parent,path) {
  var node=$("<div class='scrContEl srcContFile'></div>").text(name);
  node.click(function() {
    loadEntry(path,true);
  });
  $(parent).append(node);
}

function closeEditor(e) {
  $("body").removeClass("editorModal");
  
  editor.destroy();
  $("#editScreenBg").remove();
  editor=null;
}

var loadedId=-1;
var fromContent=false;

var changedHeaderValue=false;
function isEditorClean() {
  return ((editor.getSession().getUndoManager().isClean()) && (!changedHeaderValue));
}

function loadEntry(id,idFromContent) {
  openEditor();

  if (!isEditorClean()) {
    //ask save overwrite
  }
  
  function setData(id,data,idFromContent) {
    loadedId=id;
    fromContent=idFromContent?true:false;

    for (var name in data.header) {
      $("#editScreenHead_"+name).val(data.header[name]);
    }

    //editor set content
    if (data.data==undefined) {
      editor.setValue("no data",-1);
      editor.setReadOnly(true);
    } else {
      editor.setReadOnly(false);
      switch (data.header.type) {
        case "static":
          editor.getSession().setMode("ace/mode/html");
          editor.setValue(data.data,-1);
          break;
        case "script":
          editor.getSession().setMode("ace/mode/javascript");
          editor.setValue(data.data,-1);
          break;
        case "data":
          editor.getSession().setMode("ace/mode/json");
          editor.setValue(data.data,-1);
          break;
        default:
          display("Unknown type: "+data.header.type);
          break;
      }
    }
    editor.getSession().getUndoManager().markClean();
  }

  if ((id!=undefined) && (!idFromContent)) {
    $.ajax(riseCMSHost+"/plugins/editor/"+id+"/get",{
      type:"GET",
      dataType:"json",
      cache:false,
      success:function(data,testStatus,jqXHR) {
        if (data.code!=200) {
          display("Error "+data.code+" - "+data.desc);
          return;
        }

        setData(id,data);
      },
      error:function() {
        display("Can not connect to server");
      }
    });
  } else {
    if (idFromContent) {
      $.ajax(riseCMSHost+"/plugins/editor/content/get/"+id,{
        type:"GET",
        dataType:"json",
        cache:false,
        success:function(data,testStatus,jqXHR) {
          if (data.code!=200) {
            display("Error "+data.code+" - "+data.desc);
            return;
          }

          data.header={
            id:undefined,
            section:undefined,
            path:undefined,
            name:undefined,
            uri_name:undefined,
            title:undefined,
            parent:undefined,
            type:"static",
            created:undefined
          };
          setData(id,data,true);
        },
        error:function() {
          display("Can not connect to server");
        }
      });
    } else {
      setData(undefined,{
      header:{
        id:undefined,
        section:undefined,
        path:undefined,
        name:undefined,
        uri_name:undefined,
        title:undefined,
        parent:undefined,
        type:"static",
        created:undefined
      },
      data:""
    });
    }
  }
}

function saveCurrent(excludeHeader,excludeData) {
  if (fromContent) {
    if ((excludeHeader) || (excludeData)) {
      throw new Error("header and file data can not be excluded in content data");
    }

    saveContent(loadedId,readContent());
  } else {
    var header=undefined;
    if (!excludeHeader) {
      header=readHeader();
      delete header.id;
    }
    var content=excludeData?undefined:readContent();
      
    if (loadedId==undefined) {
      saveNewItem(header,content);
    } else {
      saveItem(loadedId,header,content);
    }
  }
}

headerFields=["id","section","path","name","uri_name","title","parent","type","created"];

function readHeader() {
  var header={};
  for (var name in headerFields) {
    header[headerFields[name]]=$("#editScreenHead_"+headerFields[name]).val();
  }
  return header;
}

function readContent() {
  var val=editor.getValue();
  return (editor.getReadOnly())?undefined:val;
}

function saveItem(id,header,data) {
  $.ajax(riseCMSHost+"/plugins/editor/"+id+"/set",{
    type:"POST",
    dataType:"json",
    data:{
      header:(typeof header=="undefined")?undefined:JSON.stringify(header),
      data:  data
    },
    success:function(data,testStatus,jqXHR) {
      if (data.code==200) {
        display("ok");
      } else {
        display("could not save item");
      }
    },
    error:function() {
      display("Can not connect to server");
    }
  });
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

function saveContent(id,data) {
  $.ajax(riseCMSHost+"/plugins/editor/content/set/"+id,{
    type:"POST",
    dataType:"json",
    data:{
      data:  data
    },
    success:function(data,testStatus,jqXHR) {
      if (data.code==200) {
        display("ok");
      } else {
        display("could not save content");
      }
    },
    error:function() {
      display("Can not connect to server");
    }
  });
}