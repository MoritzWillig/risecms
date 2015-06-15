
var test_obj={
  name:"list1",
  items:[
    100.5,
    123.3,
    433.3,
    32E2
  ],
  filepath:null
};

//store provider
var provider;
//store editor
var editor;


$("body").ready(function() {
  provider=new DefaultJSONEditorProvider();
  editor=new JSONEditor(undefined,provider);

  //modify gui & append to document
  var dom=editor.getDom();
  $("#content").empty().append(dom);
  dom.css("box-shadow","0px 0px 5px #aaa inset").css("padding","3px");

  //set value
  var test_str=JSON.stringify(test_obj);
  editor.setValue(test_str);
});