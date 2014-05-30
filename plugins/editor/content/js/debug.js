
var enclosingTags=true;

function display(str) {
  console.log(str);
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
        return { id:c.dataset.id, tag:c.dataset.tag };
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
      var debugData={ id:n.dataset.id, tag:n.dataset.tag };
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
    console.log("searching source of",t);
    var data=findOrigin(t);
    console.log("found origin at id ",data.id);

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
  for (var i=0; i<nodes.length; i++) { var src=nodes[i].dataset;
    if (ids.indexOf(src.id)==-1) {
      var item=$("<div class='editScreenSourceEntry'>"+src.id+"</div>");
      item.click(
        (function(id) {
          return function() { loadEntry(id); }
        })(src.id));
      $(srcs).append(item);
      ids.push(src.id);
    }
  }

  var add=$("<div class='editScreenSourceEntry'>+</div>");
  add.click(function() { alert("x"); });
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
  
  $.getJSON("/plugins/editor/"+id+"/get",function(data,testStatus,jqXHR) {
    if (data.code!=200) {
      display("Error "+data.code+" - "+data.descr);
      return;
    }

    loadedId=id;

    for (var name in data.header) {
      $("#editScreenHead_"+name).val(data.header[name]);
    }

    //editor set content
    switch (data.header.type) {
      case "static":
        editor.getSession().setMode("ace/mode/html");
        editor.setValue(data.data);
        break;
      case "script":
        editor.getSession().setMode("ace/mode/javascript");
        editor.setValue(data.data);
        break;
      case "data":
        editor.getSession().setMode("ace/mode/json");
        editor.setValue(data.data);
        break;
      default:
        display("Unknown type: "+data.header.type);
        break;
    }
    editor.getSession().getUndoManager().markClean();
  }).fail(function() {
    display("Error");
  });
}

function newItem() {
}

function saveHeader(id,data) {

}

function saveContent(id,data) {

}