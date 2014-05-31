
var enclosingTags=true;

function display(str) {
  console.log(str);
  var x=$("<div id='displayForm'></div>")
  .text(str)
  .click(function() {
    $(x).remove();
  });
  $("body").append(x);
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

var editor;
function openEditor() {
  if (editor) { return; }
  $("body").append($("\
    <div id='editScreenBg'>\
      <div id='editScreenWindow'>\
        <div id='editScreenTitlebar'>\
          <div id='editScreenClose' onclick='closeEditor()'>x</div>\
        </div>\
        <div id='editScreenSources'></div>\
        <div id='editScreenHeader'>\
          <button>save header</button>\
          <input class='editScreenHead' id='editScreenHead_id'>\
          <input class='editScreenHead' id='editScreenHead_section'>\
          <input class='editScreenHead' id='editScreenHead_path'>\
          <input class='editScreenHead' id='editScreenHead_name'>\
          <input class='editScreenHead' id='editScreenHead_uri_name'>\
          <input class='editScreenHead' id='editScreenHead_title'>\
          <input class='editScreenHead' id='editScreenHead_parent'>\
          <input class='editScreenHead' id='editScreenHead_type'>\
          <input class='editScreenHead' id='editScreenHead_created'>\
        </div>\
        <div id='editScreen'></div>\
        <div id='editScreenFooter'>\
          <button>save content</button>\
          <button>save all</button>\
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
  var srcs=document.getElementById("editScreenSources");

  var ids=[];
  function addId(id) {
    if (ids.indexOf(id)==-1) {
      var item=$("<div class='editScreenSourceEntry'>"+id+"</div>");
      item.click(function() {
        loadEntry(id);
      });
      $(srcs).append(item);
      ids.push(id);
    }
  }
  for (var i=0; i<nodes.length; i++) {
    var src=nodes[i].dataset;
    addId(src.id);
    if (src.dataid) {
      addId(src.dataid);
    }
  }

  var add=$("<div class='editScreenSourceEntry'>+</div>");
  add.click(function() {
    loadEntry(undefined);
  });
  $(srcs).append(add);
}

function closeEditor(e) {
  editor.destroy();
  $("#editScreenBg").remove();
  editor=null;
}

var loadedId=-1;

var changedHeaderValue=false;
function isEditorClean() {
  return ((editor.getSession().getUndoManager().isClean()) && (!changedHeaderValue));
}

function loadEntry(id) {
  openEditor();

  if (!isEditorClean()) {
    //ask save overwrite
  }
  
  function setData(id,data) {
    loadedId=id;

    for (var name in data.header) {
      $("#editScreenHead_"+name).val(data.header[name]);
    }

    //editor set content
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
    editor.getSession().getUndoManager().markClean();
  }

  if (id!=undefined) {
    $.getJSON("/plugins/editor/"+id+"/get",function(data,testStatus,jqXHR) {
      if (data.code!=200) {
        display("Error "+data.code+" - "+data.descr);
        return;
      }

      setData(id,data);
    }).fail(function() {
      display("Error");
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

function newItem() {
}

function saveHeader(id,data) {

}

function saveContent(id,data) {

}