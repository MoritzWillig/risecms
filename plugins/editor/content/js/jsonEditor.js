
//FIXME rename to JSONEditor

/**
 * editor for arbitrary json values
 * @param {*} value json value
 */
function JSONEditNode(value) {
  this.onChange=new EventHandler(this);

  this._nodes={};
  this._type="string";

  this.dom={};
  this.dom._types=this._createTypeSelector();
  this.dom._editor=this._getEditor(this.type);
  this.dom.wrapper=this._createWrapper();

  this.setValue(value);
}

JSONEditNode.prototype._type=undefined;

JSONEditNode.prototype.dom=undefined;

JSONEditNode.prototype._value=undefined;

JSONEditNode.prototype._nodes=undefined;

JSONEditNode.prototype.onChange=undefined;

JSONEditNode.prototype._jsonType=function _jsonType(value) {
  if (value===undefined) { value={}; }
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "object":
      if (value==null) {
        return "null";
      }
      if (Array.isArray(value)) {
        return "array";
      } else {
        return "object";
      }
    case "boolean":
      return "boolean";
    default:
      throw new Error("non json type");
  }
}

JSONEditNode.prototype._typeByValue=function _typeByValue(type) {
  return ((type!="object") && (type!="array"));
}

JSONEditNode.prototype.setValue=function setValue(value) {
  var self=this;

  //reset editor
  this.dom._editor.getDom().detach();

  //set new value
  this._value=value;
  this._setType(this._jsonType(value));

  //insert new editor
  /*
    FIXME the was updating value on change - add onChange to editorInterface or correct getValue
    --some old code--
      var listener=(function (nodeName) {
        return function(value) {
          self._value[nodeName]=value;
        };
      })(i);

      var node=new JSONEditNode(val);
      node.onChange.register(listener);
  */
  this.dom._editor=this._getEditor(this._type);

  this.dom.wrapper.dom.nodes.append(this.dom._editor.getDom());
  this.dom._editor.setValue(this._value);

  this.onChange.trigger(this._value);
}

JSONEditNode.prototype.detach=function detach() {
  this.dom.wrapper.dom.frame.detach();
}

JSONEditNode.prototype.getValue=function getValue() {
  return this._value;
  saddsfafds
  asdfdsfadsf
  sdafdsfadfs
}

JSONEditNode.prototype._createWrapper=function _createWrapper() {
  var dom={
    nodes:$("<div>",{
      class:"nodes",
      css:{
        "padding-left":"20px"
      }
    })
  };

  dom.frame=$("<div>", {
    html:[
      this.dom._types.dom.frame,
      dom.nodes
    ]
  });

  return {
    dom:dom,
    addDom:function(dom) {
      dom.nodes.append(dom);
    }
  };
}

//default values to set if the type of a node is changed or a new node is created
JSONEditNode.prototype._typeDefaults={
  string:"",
  number:0,
  boolean:true,
  object:{},
  array:[],
  null:null
};

JSONEditNode.prototype._setTypeDefault=function _setTypeDefault(type) {
  var value;
  if (!this._typeByValue(type)) {
    switch (type) {
      case "object":
        value={};
        for (var i in this._typeDefaults[type]) {
          value[i]=this._typeDefaults[type][i];
        }
        break;
      case "array":
        value=this._typeDefaults[type].slice();
        break;
      default:
        throw new Error("unknown type");
    }
  } else {
    value=this._typeDefaults[type];
  }
  this.setValue(value);
}

JSONEditNode.prototype._createTypeSelector=function _createTypeSelector() {
  var self=this;

  var dom={
    stringSel:$("<span>",{
      class:"typeSelOpt",
      text:"string",
    }).click(function() {
      self._setTypeDefault("string");
    }),
    numberSel:$("<span>",{
      class:"typeSelOpt",
      text:"number"
    }).click(function() {
      self._setTypeDefault("number");
    }),
    booleanSel:$("<span>",{
      class:"typeSelOpt",
      text:"bool"
    }).click(function() {
      self._setTypeDefault("boolean");
    }),
    objectSel:$("<span>",{
      class:"typeSelOpt",
      text:"object"
    }).click(function() {
      self._setTypeDefault("object");
    }),
    arraySel:$("<span>",{
      class:"typeSelOpt",
      text:"array"
    }).click(function() {
      self._setTypeDefault("array");
    }),
    nullSel:$("<span>",{
      class:"typeSelOpt",
      text:"null"
    }).click(function() {
      self._setTypeDefault("null");
    })
  };

  dom.frame=$("<div>",{
    html:[
      dom.stringSel,
      dom.numberSel,
      dom.booleanSel,
      dom.objectSel,
      dom.arraySel,
      dom.nullSel
    ]
  });

  return {
    dom:dom
  };
}

/**
 * free form editor for arbitrary text
 * @return {object} editor object containing get/setValue function
 */
JSONEditNode.prototype._getEditor=function _getEditor(type) {
  switch (type) {
    case "string":
      return this._getStringEditor();
    case "number":
      return this._getNumberEditor();
    case "boolean":
      return this._getBooleanEditor();
    case "array":
      return this._getArrayEditor();
    case "object":
      return this._getObjectEditor();
    case "null":
      return this._getNullEditor();
    default:
      return this._getStringEditor();
  }
}

JSONEditNode.prototype._getStringEditor=function _getStringEditor() {
  return new SimpleStringEditor("");
}

JSONEditNode.prototype._getNumberEditor=function _getNumberEditor() {
  return new JSONNumberEditor(0);
}

JSONEditNode.prototype._getBooleanEditor=function _getBooleanEditor() {
  var dom={};
  dom.buttons={
    true:$("<span>",{
      text:"true",
      class:"boolEditButton",
      click:function() {
        if (!editor._readOnly) {
          editor.setValue(true);
        }
      }
    }),
    false: $("<span>",{
      text:"false",
      class:"boolEditButton",
      click:function() {
        if (!editor._readOnly) {
          editor.setValue(false);
        }
      }
    })
  };

  dom.valField=$("<div>",{
    html:[
      dom.buttons.true,
      dom.buttons.false
    ]
  });

  var editor={
    _value:true,
    _readOnly:false,
    getDom:function() {
      return dom.valField;
    },
    setReadOnly:function(readOnly) {
      editor._readOnly=readOnly;
    },
    setValue:function(value) {
      editor._value=value;

      if (editor._value) {
        dom.buttons.true.addClass("boolEditButtonActive");
        dom.buttons.false.removeClass("boolEditButtonActive");
      } else {
        dom.buttons.true.removeClass("boolEditButtonActive");
        dom.buttons.false.addClass("boolEditButtonActive");
      }
    },
    getValue:function() {
      return editor._value;
    }
  };
  return editor;
}

JSONEditNode.prototype._getArrayEditor=function _getStringEditor() {
  return new JSONArrayEditor();
}

JSONEditNode.prototype._getObjectEditor=function _getStringEditor() {
  return new JSONObjectEditor();
}

JSONEditNode.prototype._getNullEditor=function _getStringEditor() {
  var dom=$(); //has no gui
  var editor={
    getDom:function() {
      return dom;
    },
    setReadOnly:function(readOnly) {
      //we are always read only. do nothing
    },
    setValue:function(value) {
      if (value!=null) {
        throw new Exception("value has to be null");
      }
    },
    getValue:function() {
      return null;
    }
  };
  return editor;
}

JSONEditNode.prototype._setType=function _setType(type) {
  var oSelStr=this._type+"Sel";
  var oSelector=this.dom._types.dom[oSelStr];
  oSelector.removeClass("typeSelOptActive");

  this._type=type;

  var selStr=this._type+"Sel";
  var selector=this.dom._types.dom[selStr];
  selector.addClass("typeSelOptActive");
}

JSONEditNode.prototype.setReadOnly=function setReadOnly(readOnly) {
  this.dom._editor.setReadOnly(readOnly);

  for (var i in this._nodes) {
    this._nodes[i].node.setReadOnly(readOnly);
  }
}

JSONEditNode.prototype.getDom=function getDom() {
  return this.dom.wrapper.dom.frame;
}

/**
 * JSONEditNode wrapper for the editor interface
 * @param {*} value data display
 */
function JSONEditor(value) {
  this._hasError=false;
  this.root=new JSONEditNode();
  this.setValue(value);
  this.root.dom.wrapper.dom.frame
    .css("height","100%")
    .css("overflow","auto")
    .css("background-color","#000")
    .css("color","#fff");
};
JSONEditor.prototype.root=undefined;

JSONEditor.prototype.hasError=false;

JSONEditor.prototype.setValue=function setValue(value) {
  var data;
  this._hasError=false;
  try {
    data=JSON.parse(value);
  } catch(e) {
    data=value; //treat value as single json string
    this._hasError=true;
  }

  this.root.setValue(data);
}

JSONEditor.prototype.getValue=function getValue() {
  var value;
  var data=this.root.getValue();
  if (!this._hasError) {
    value=JSON.stringify(data);
  } else {
    //data is a (user modified) string in json format
    value=data;
  }
  return value;
}

JSONEditor.prototype.setMode=function setMode(data) {
  //we do not have any modes ... do nothing
};

JSONEditor.prototype.getDom=function getDom() {
  return this.root.dom.wrapper.dom.frame;
}

JSONEditor.prototype.setReadOnly=function setReadOnly(readOnly) {
  this.root.setReadOnly(readOnly);
}