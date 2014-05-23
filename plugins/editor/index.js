
var sourceTracker={
  addTrace:function(event,data) {
    data.string=
      "\n<span class='riseCMSDebug' data-tag='open'  data-id='"+data.id+"'>\n"
      +data.string+
      "\n</span>\n";
    
    //"\n<div class='riseCMSDebug' data-tag='open'  data-id='"+id+"'></div>\n"
    //"\n<div class='riseCMSDebug' data-tag='close' data-id='"+id+"'></div>\n",
  }
};

function editorInit(pluginHandler) {
  pluginHandler.on("itemStr.post",sourceTracker.addTrace);
}



module.exports=editorInit;