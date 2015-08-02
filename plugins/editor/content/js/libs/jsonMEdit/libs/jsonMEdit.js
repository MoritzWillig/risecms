function InterfaceError(a) {
  Error.prototype.constructor.apply(this, arguments);
  this.name = "InterfaceError";
  this.message = a;
}
InterfaceError.prototype = Error.prototype;
function Interface() {
  Object.defineProperty(this, "___interfaces", {enumerable:!1, value:[this]});
}
Interface.IfcFunc = function(a, b) {
  void 0 == b && (b = !1);
  Object.defineProperty(a, "___ifcFunc", {enumerable:!1, value:{optional:b}});
  return a;
};
function isInstanceOf(a, b) {
  return a instanceof b;
}
Object.defineProperty(Interface.prototype, "$include", {configurable:!1, enumerable:!1, value:function(a) {
  if (0 == isInstanceOf(a, Interface.constructor)) {
    throw Error("trying to include a non interface object");
  }
  for (var b in a.prototype) {
    if (b in this) {
      throw Error("attribute already exists");
    }
    this[b] = a.prototype[b];
  }
  Array.prototype.push.apply(this.___interfaces, a.___interfaces);
}});
Object.defineProperty(Interface.prototype, "$includes", {configurable:!1, enumerable:!1, value:function(a) {
  return -1 != this.___interfaces.indexOf(a.prototype);
}});
Object.defineProperty(Interface.prototype, "$fromInterface", {configurable:!1, enumerable:!1, value:function(a) {
  return this[a] && this[a].___ifcFunc;
}});
Object.defineProperty(Interface, "$test", {configurable:!1, enumerable:!1, value:function(a, b) {
  var c = [], d;
  for (d in b.prototype) {
    if (a[d] === b.prototype[d]) {
      try {
        b.prototype[d]();
      } catch (e) {
        if (e instanceof InterfaceError) {
          c.push(d);
        } else {
          throw Error("caught an error which was no instance of InterfaceError");
        }
      }
    }
  }
  return c;
}});
function ClassHelper() {
}
Object.defineProperty(ClassHelper, "$merge", {configurable:!1, enumerable:!1, value:function(a, b, c) {
  void 0 == c && (c = !1);
  for (var d in b.prototype) {
    if (d in a.prototype && !a.prototype.$fromInterface(d) && !c) {
      throw Error("attribute already exists: " + d);
    }
    a.prototype[d] = b.prototype[d];
  }
}});
function IEventHandler() {
}
IEventHandler.prototype = new Interface;
IEventHandler.prototype.register = Interface.IfcFunc(function(a) {
  throw new InterfaceError("not implemented");
});
IEventHandler.prototype.unregister = Interface.IfcFunc(function(a) {
  throw new InterfaceError("not implemented");
});
IEventHandler.prototype.clear = Interface.IfcFunc(function() {
  throw new InterfaceError("not implemented");
});
IEventHandler.prototype.isRegistered = Interface.IfcFunc(function(a) {
  throw new InterfaceError("not implemented");
});
IEventHandler.prototype.trigger = Interface.IfcFunc(function() {
  throw new InterfaceError("not implemented");
});
function IEditor(a) {
}
IEditor.prototype = new Interface;
IEditor.prototype.$include(IEventHandler);
IEditor.prototype.setValue = Interface.IfcFunc(function(a) {
  throw new InterfaceError("not implemented");
});
IEditor.prototype.getValue = Interface.IfcFunc(function() {
  throw new InterfaceError("not implemented");
});
IEditor.prototype.setMode = Interface.IfcFunc(function(a) {
}, !0);
IEditor.prototype.getDom = Interface.IfcFunc(function() {
  throw new InterfaceError("not implemented");
});
IEditor.prototype.setReadOnly = Interface.IfcFunc(function(a) {
  throw new InterfaceError("not implemented");
});
IEditor.prototype.hasValidState = Interface.IfcFunc(function() {
  throw new InterfaceError("not implemented");
});
function IEditorProvider() {
}
IEditorProvider.prototype = new Interface;
IEditorProvider.prototype.requestEditor = Interface.IfcFunc(function(a) {
  throw new InterfaceError("not implemented");
});
IEditorProvider.prototype.disposeEditor = Interface.IfcFunc(function(a) {
  throw new InterfaceError("not implemented");
});
function EventHandler(a) {
  this._listeners = [];
  this._owner = a;
}
EventHandler.prototype = new IEventHandler;
EventHandler.prototype._idx = function(a) {
  return this._listeners.indexOf(a);
};
EventHandler.prototype.register = function(a) {
  if (this.isRegistered(a)) {
    throw Error("listener is already registered");
  }
  this._listeners.push(a);
};
EventHandler.prototype.unregister = function(a) {
  var b = {};
  if (!this.isRegistered(a, b)) {
    throw Error("listener is not registered");
  }
  this._listeners.splice(b.idx, 1);
};
EventHandler.prototype.isRegistered = function(a, b) {
  var c = this._idx(a);
  b && (b.idx = c);
  return -1 != c;
};
EventHandler.prototype.clear = function() {
  this._listeners.length = 0;
};
EventHandler.prototype.trigger = function() {
  for (var a in this._listeners) {
    this._listeners[a].apply(this._owner, arguments);
  }
};
function JSONNullEditor(a, b) {
  EventHandler.apply(this, [this]);
  this._classPrefix = void 0 === b ? "" : b;
  this._dom = $();
  this.setValue(a);
}
JSONNullEditor.prototype = new IEditor;
ClassHelper.$merge(JSONNullEditor, EventHandler);
JSONNullEditor.prototype.setValue = function(a) {
  (this._undefined = void 0 === a) ? (this.setReadOnly(!0), this.trigger(this)) : null !== a ? this.setValue(void 0) : (this.setReadOnly(!1), this.trigger(this));
};
JSONNullEditor.prototype.getValue = function() {
  return this._undefined ? void 0 : null;
};
JSONNullEditor.prototype.hasValidState = function() {
  return !this._undefined;
};
JSONNullEditor.prototype.getDom = function() {
  return this._dom;
};
JSONNullEditor.prototype.setReadOnly = function(a) {
};
function JSONNumberEditor(a, b) {
  EventHandler.apply(this, [this]);
  this._classPrefix = void 0 === b ? "" : b;
  var c = this;
  this._dom = {valField:$("<textarea>", {"class":this._classPrefix + "JSONNumberEditor"}).change(function() {
    c._checkTextarea();
  })};
  this.setValue(a);
}
JSONNumberEditor.prototype = new IEditor;
ClassHelper.$merge(JSONNumberEditor, EventHandler);
JSONNumberEditor.prototype._checkTextarea = function() {
  void 0 === this.getValue() ? this._dom.valField.css("background-color", "#a20").css("color", "#fff") : this._dom.valField.css("background-color", "").css("color", "");
};
JSONNumberEditor.prototype._isValid = function(a) {
  return "number" == typeof a;
};
JSONNumberEditor.prototype._parseNumber = function(a) {
  var b;
  try {
    b = JSON.parse(a);
  } catch (c) {
  }
  return b;
};
JSONNumberEditor.prototype.setValue = function(a) {
  (this._undefined = void 0 === a) ? (this.setReadOnly(!0), this._dom.valField.val("")) : (this._dom.valField.val(a), this._checkTextarea(), this.setReadOnly(!1));
  this.trigger(this);
};
JSONNumberEditor.prototype.getValue = function() {
  var a = this._dom.valField.val(), a = this._parseNumber(a);
  if (!this._undefined && this._isValid(a)) {
    return a;
  }
};
JSONNumberEditor.prototype.hasValidState = function() {
  return !this._undefined;
};
JSONNumberEditor.prototype.getDom = function() {
  return this._dom.valField;
};
JSONNumberEditor.prototype.setReadOnly = function(a) {
  a ? this._dom.valField.prop("readOnly", !0) : this._dom.valField.removeProp("readOnly");
};
function JSONBooleanEditor(a, b) {
  EventHandler.apply(this, [this]);
  this._classPrefix = void 0 === b ? "" : b;
  var c = this;
  this._dom = {};
  this._dom.buttons = {"true":$("<span>", {text:"true", "class":this._classPrefix + "boolEditButton", click:function() {
    c._readOnly || c.setValue(!0);
  }}), "false":$("<span>", {text:"false", "class":this._classPrefix + "boolEditButton", click:function() {
    c._readOnly || c.setValue(!1);
  }})};
  this._dom.valField = $("<div>", {html:[this._dom.buttons["true"], this._dom.buttons["false"]]});
  this.setReadOnly(!1);
  this.setValue(a);
}
JSONBooleanEditor.prototype = new IEditor;
ClassHelper.$merge(JSONBooleanEditor, EventHandler);
JSONBooleanEditor.prototype.setValue = function(a) {
  if (this._undefined = void 0 === a) {
    this.setReadOnly(!0), this._value = a, this._dom.buttons["true"].removeClass(this._classPrefix + "boolEditButtonActive"), this._dom.buttons["false"].addClass(this._classPrefix + "boolEditButtonActive");
  } else {
    if ("boolean" != typeof a) {
      throw Error("value is no boolean");
    }
    (this._value = a) ? (this._dom.buttons["true"].addClass(this._classPrefix + "boolEditButtonActive"), this._dom.buttons["false"].removeClass(this._classPrefix + "boolEditButtonActive")) : (this._dom.buttons["true"].removeClass(this._classPrefix + "boolEditButtonActive"), this._dom.buttons["false"].addClass(this._classPrefix + "boolEditButtonActive"));
    this.setReadOnly(!1);
  }
  this.trigger(this);
};
JSONBooleanEditor.prototype.getValue = function() {
  return this._undefined ? void 0 : this._value;
};
JSONBooleanEditor.prototype.hasValidState = function() {
  return !this._undefined;
};
JSONBooleanEditor.prototype.getDom = function() {
  return this._dom.valField;
};
JSONBooleanEditor.prototype.setReadOnly = function(a) {
  this._readOnly = a;
};
function JSONObjectEditor(a, b, c) {
  EventHandler.apply(this, [this]);
  this._provider = b;
  this._classPrefix = void 0 === c ? "" : c;
  var d = this;
  this._dom = {root:$("<div>", {"class":this._classPrefix + "JSONObjectEditor"}), insertName:$("<input>", {}), insertNew:$("<button>", {text:"+", click:function() {
    d._addNode(d._dom.insertName.val());
  }}), nodes:$("<div>", {})};
  this._dom.root.append(this._dom.insertName);
  this._dom.root.append(this._dom.insertNew);
  this._dom.root.append(this._dom.nodes);
  this._readOnly = !1;
  this._wrappers = [];
  this._wrapperNames = [];
  this.setValue(a);
}
JSONObjectEditor.prototype = new IEditor;
ClassHelper.$merge(JSONObjectEditor, EventHandler);
JSONObjectEditor.prototype.setValue = function(a) {
  this._undefined = void 0 === a;
  for (var b in this._wrappers) {
    var c = this._wrappers[b];
    c.wrapper.detach();
  }
  this._wrappers.length = 0;
  this._wrapperNames.length = 0;
  if (this._undefined) {
    this.setReadOnly(!0);
  } else {
    if ("object" != typeof a) {
      throw Error("invalid value type");
    }
    for (b in a) {
      c = this._createWrapper(b, a[b]), this._wrappers.push(c), this._wrapperNames.push(b), this._dom.nodes.append(c.wrapper);
    }
    this.setReadOnly(!1);
  }
  this.trigger(this);
};
JSONObjectEditor.prototype._createWrapper = function(a, b) {
  var c = this._provider.requestEditor("json");
  c.setValue(b);
  var d = this, e = {wrapper:$("<div>", {html:[$("<button>", {text:"-", click:function() {
    d._removeNode(e);
  }}), $("<span>", {text:a, click:function() {
  }}), c.getDom()]}), node:c};
  return e;
};
JSONObjectEditor.prototype._addNode = function(a) {
  if (!this._readOnly) {
    if (-1 != this._wrapperNames.indexOf(a)) {
      throw Error("name existing");
    }
    var b = this._createWrapper(a, "");
    this._wrappers.push(b);
    this._wrapperNames.push(a);
    this._dom.nodes.append(b.wrapper);
  }
};
JSONObjectEditor.prototype._removeNode = function(a) {
  if (!this._readOnly) {
    var b = this._getIdxByWrapper(a);
    a = this._wrappers[b];
    a.wrapper.detach();
    this._wrappers.splice(b, 1);
    this._wrapperNames.splice(b, 1);
  }
};
JSONObjectEditor.prototype._getIdxByWrapper = function(a) {
  a = this._wrappers.indexOf(a);
  if (-1 == a) {
    throw Error("invalid wrapper");
  }
  return a;
};
JSONObjectEditor.prototype.getValue = function() {
  if (!this._undefined) {
    for (var a = {}, b = 0;b < this._wrappers.length;b++) {
      a[this._wrapperNames[b]] = this._wrappers[b].node.getValue();
    }
    return a;
  }
};
JSONObjectEditor.prototype.hasValidState = function() {
  return !this._undefined;
};
JSONObjectEditor.prototype.getDom = function() {
  return this._dom.root;
};
JSONObjectEditor.prototype.setReadOnly = function(a) {
  this._readOnly = a;
  for (var b in this._wrappers) {
    this._wrappers[b].node.setReadOnly(this._readOnly);
  }
};
function JSONArrayEditor(a, b, c) {
  EventHandler.apply(this, [this]);
  this._provider = b;
  this._classPrefix = void 0 === c ? "" : c;
  var d = this;
  this._dom = {root:$("<div>", {}), insertLast:$("<button>", {"class":this._classPrefix + "insElement", text:"+", click:function() {
    d._addNodeLast();
  }}), nodes:$("<div>", {"class":this._classPrefix + "JSONArrayEditor"})};
  this._dom.root.append(this._dom.nodes);
  this._dom.root.append(this._dom.insertLast);
  this._readOnly = !1;
  this._nodes = [];
  this.setValue(a);
}
JSONArrayEditor.prototype = new IEditor;
ClassHelper.$merge(JSONArrayEditor, EventHandler);
JSONArrayEditor.prototype.setValue = function(a) {
  this._undefined = void 0 === a;
  for (var b in this._nodes) {
    this._nodes[b].wrapper.detach();
  }
  this._nodes.length = 0;
  if (this._undefined) {
    this.setReadOnly(!0);
  } else {
    if (!Array.isArray(a)) {
      throw Error("invalid value type");
    }
    for (b = 0;b < a.length;b++) {
      var c = this._createWrapper(a[b]);
      this._nodes.push(c);
      this._dom.nodes.append(c.wrapper);
    }
    this.setReadOnly(!1);
  }
  this.trigger(this);
};
JSONArrayEditor.prototype._createWrapper = function(a) {
  var b = this._provider.requestEditor("json");
  b.setValue(a);
  var c = this, d = {wrapper:$("<div>", {html:[$("<button>", {"class":this._classPrefix + "insElement", text:"+", click:function() {
    c._addNode(d, b);
  }}), $("<button>", {"class":this._classPrefix + "delElement", text:"-", click:function() {
    c._removeNode(d);
  }}), b.getDom()]}), node:b};
  return d;
};
JSONArrayEditor.prototype._addNodeLast = function() {
  if (!this._readOnly) {
    var a = this._nodes.length;
    if (0 < a) {
      var b = this._nodes[a - 1].node.getValue();
      void 0 === b && (b = "");
      b = JSONEditorHelper.getJSONType(b);
    } else {
      b = "string";
    }
    b = JSONEditorHelper.getTypeDefault(b);
    b = this._createWrapper(b);
    this._dom.nodes.append(b.wrapper);
    this._nodes.splice(a, 0, b);
  }
};
JSONArrayEditor.prototype._addNode = function(a) {
  if (!this._readOnly) {
    var b = this._getIndexByWrapper(a);
    0 < b ? (a = this._nodes[b - 1].node.getValue(), void 0 === a && (a = ""), a = JSONEditorHelper.getJSONType(a)) : a = "string";
    a = JSONEditorHelper.getTypeDefault(a);
    a = this._createWrapper(a);
    this._nodes[b].wrapper.before(a.wrapper);
    this._nodes.splice(b, 0, a);
  }
};
JSONArrayEditor.prototype._removeNode = function(a) {
  this._readOnly || (a = this._getIndexByWrapper(a), this._nodes[a].wrapper.detach(), this._nodes.splice(a, 1));
};
JSONArrayEditor.prototype._getIndexByWrapper = function(a) {
  a = this._nodes.indexOf(a);
  if (-1 == a) {
    throw Error("invalid wrapper");
  }
  return a;
};
JSONArrayEditor.prototype.getValue = function() {
  if (!this._undefined) {
    for (var a = [], b = 0;b < this._nodes.length;b++) {
      a.push(this._nodes[b].node.getValue());
    }
    return a;
  }
};
JSONArrayEditor.prototype.hasValidState = function() {
  return !this._undefined;
};
JSONArrayEditor.prototype.getDom = function() {
  return this._dom.root;
};
JSONArrayEditor.prototype.setReadOnly = function(a) {
  this._readOnly = a;
  for (var b in this._nodes) {
    this._nodes[b].node.setReadOnly(this._readOnly);
  }
};
function SimpleStringEditor(a, b) {
  EventHandler.apply(this, [this]);
  this._classPrefix = void 0 === b ? "" : b;
  this._dom = {valField:$("<textarea>", {"class":this._classPrefix + "SimpleStringEditor"})};
  this.setValue(a);
}
SimpleStringEditor.prototype = new IEditor;
ClassHelper.$merge(SimpleStringEditor, EventHandler);
SimpleStringEditor.prototype.setValue = function(a) {
  (this._undefined = void 0 === a) ? (this.setReadOnly(!0), this._dom.valField.val("")) : (this._dom.valField.val(a), this.setReadOnly(!1));
  this.trigger(this);
};
SimpleStringEditor.prototype.getValue = function() {
  return this._undefined ? void 0 : this._dom.valField.val();
};
SimpleStringEditor.prototype.hasValidState = function() {
  return !this._undefined;
};
SimpleStringEditor.prototype.getDom = function() {
  return this._dom.valField;
};
SimpleStringEditor.prototype.setReadOnly = function(a) {
  a ? this._dom.valField.prop("readOnly", !0) : this._dom.valField.removeProp("readOnly");
};
JSONEditorHelper = {_typeDefaults:{string:"", number:0, "boolean":!0, object:{}, array:[], "null":null}, getJSONType:function(a) {
  switch(typeof a) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "object":
      return null == a ? "null" : Array.isArray(a) ? "array" : "object";
    case "boolean":
      return "boolean";
    default:
      throw Error("non json type");;
  }
}, byReference:function(a) {
  return "object" == a || "array" == a;
}, getTypeDefault:function(a) {
  var b;
  if (this.byReference(a)) {
    switch(a) {
      case "object":
        b = {};
        var c = this._typeDefaults[a], d;
        for (d in c[a]) {
          b[d] = c[d];
        }
        break;
      case "array":
        b = this._typeDefaults[a].slice();
        break;
      default:
        throw Error("unknown type");;
    }
  } else {
    b = this._typeDefaults[a];
  }
  return b;
}};
function JSONDynamicNode(a, b, c) {
  EventHandler.apply(this, [this]);
  this._provider = b;
  this._classPrefix = void 0 === c ? "" : c;
  this._type = "string";
  this.dom = {};
  this.dom._types = this._createTypeSelector();
  this.dom._editor = this._getEditor(this._type);
  this.dom.wrapper = this._createWrapper();
  this.setValue(a);
}
JSONDynamicNode.prototype = new IEditor;
ClassHelper.$merge(JSONDynamicNode, EventHandler);
JSONDynamicNode.prototype._type = void 0;
JSONDynamicNode.prototype.dom = void 0;
JSONDynamicNode.prototype._value = void 0;
JSONDynamicNode.prototype.setValue = function(a) {
  this._undefined = void 0 === a;
  this.dom._editor.getDom().detach();
  this._undefined ? (this._setType("string"), this.dom._editor = this._getEditor(this._type), this.setReadOnly(!0)) : (this._value = a, this._setType(JSONEditorHelper.getJSONType(this._value)), this.dom._editor = this._getEditor(this._type), this.dom.wrapper.dom.nodes.append(this.dom._editor.getDom()), this.dom._editor.setValue(this._value), this.setReadOnly(!1));
  this.trigger(this);
};
JSONDynamicNode.prototype.getValue = function() {
  return this._undefined ? void 0 : this.dom._editor.getValue();
};
JSONDynamicNode.prototype.hasValidState = function() {
  return !this._undefined;
};
JSONDynamicNode.prototype._createWrapper = function() {
  var a = {nodes:$("<div>", {css:{"padding-left":"20px"}})};
  a.frame = $("<span>", {html:[this.dom._types.dom.frame, a.nodes], "class":this._classPrefix + "JSONDynamicNode"});
  return {dom:a, addDom:function(a) {
    a.nodes.append(a);
  }};
};
JSONDynamicNode.prototype._setTypeDefault = function(a) {
  a = JSONEditorHelper.getTypeDefault(a);
  this.setValue(a);
};
JSONDynamicNode.prototype._createTypeSelector = function() {
  var a = this, b = {stringSel:$("<span>", {"class":this._classPrefix + "typeSelOpt", text:"string"}).click(function() {
    a._setTypeDefault("string");
  }), numberSel:$("<span>", {"class":this._classPrefix + "typeSelOpt", text:"number"}).click(function() {
    a._setTypeDefault("number");
  }), booleanSel:$("<span>", {"class":this._classPrefix + "typeSelOpt", text:"bool"}).click(function() {
    a._setTypeDefault("boolean");
  }), objectSel:$("<span>", {"class":this._classPrefix + "typeSelOpt", text:"object"}).click(function() {
    a._setTypeDefault("object");
  }), arraySel:$("<span>", {"class":this._classPrefix + "typeSelOpt", text:"array"}).click(function() {
    a._setTypeDefault("array");
  }), nullSel:$("<span>", {"class":this._classPrefix + "typeSelOpt", text:"null"}).click(function() {
    a._setTypeDefault("null");
  })};
  b.frame = $("<span>", {html:[b.stringSel, b.numberSel, b.booleanSel, b.objectSel, b.arraySel, b.nullSel]});
  return {dom:b};
};
JSONDynamicNode.prototype._getEditor = function(a) {
  return this._provider.requestEditor(a);
};
JSONDynamicNode.prototype._setType = function(a) {
  this.dom._types.dom[this._type + "Sel"].removeClass(this._classPrefix + "typeSelOptActive");
  this._type = a;
  this.dom._types.dom[this._type + "Sel"].addClass(this._classPrefix + "typeSelOptActive");
};
JSONDynamicNode.prototype.setReadOnly = function(a) {
  this.dom._editor.setReadOnly(a);
};
JSONDynamicNode.prototype.getDom = function() {
  return this.dom.wrapper.dom.frame;
};
function JSONEditor(a, b, c) {
  this._provider = b;
  this._classPrefix = void 0 === c ? "" : c;
  var d = this;
  this._dom = {selectors:[$("<span>", {text:"json", "class":this._classPrefix + "typeSelOpt", click:function() {
    d.setMode("json");
  }}), $("<span>", {text:"text", "class":this._classPrefix + "typeSelOpt", click:function() {
    d.setMode("text");
  }})], "switch":$("<div>", {}), root:$("<div>", {"class":this._classPrefix + "JSONEditor"})};
  this._dom["switch"].append(this._dom.selectors);
  this._dom.root.append(this._dom["switch"]);
  this.setMode("json");
  this.setValue(a);
}
JSONEditor.prototype = new IEditor;
ClassHelper.$merge(JSONEditor, EventHandler);
JSONEditor.prototype.setValue = function(a) {
  if (void 0 === a) {
    this._editor.setValue(void 0);
  } else {
    var b;
    switch(this._mode) {
      case "json":
        try {
          this.setMode("json");
          b = JSON.parse(a);
          break;
        } catch (c) {
          this.setMode("text");
        }
      ;
      case "text":
        b = a;
        break;
      default:
        throw Error("unknown type");;
    }
    this._editor.setValue(b);
    this.trigger(this);
  }
};
JSONEditor.prototype.getValue = function() {
  var a;
  a = this._editor.getValue();
  switch(this._mode) {
    case "json":
      a = JSON.stringify(a, void 0, "  ");
      break;
    case "text":
      break;
    default:
      throw Error("unknown mode");;
  }
  return a;
};
JSONEditor.prototype.setMode = function(a) {
  if (a != this._mode) {
    var b;
    this._editor && (b = this.getValue(), this._provider.disposeEditor(this._editor));
    for (var c in this._dom.selectors) {
      this._dom.selectors[c].removeClass(this._classPrefix + "typeSelOptActive");
    }
    switch(a) {
      case "json":
        this._editor = this._provider.requestEditor("json");
        this._dom.selectors[0].addClass(this._classPrefix + "typeSelOptActive");
        break;
      case "text":
        this._editor = this._provider.requestEditor("text");
        this._dom.selectors[1].addClass(this._classPrefix + "typeSelOptActive");
        break;
      default:
        throw Error("unknown editor mode");;
    }
    this._dom.root.append(this._editor.getDom());
    this._mode = a;
    this.setValue(b);
  }
};
JSONEditor.prototype.getDom = function() {
  return this._dom.root;
};
JSONEditor.prototype.setReadOnly = function(a) {
  this._editor.setReadOnly(a);
};
function DefaultJSONEditorProvider(a) {
  this._classPrefix = a;
}
DefaultJSONEditorProvider.prototype = new IEditorProvider;
DefaultJSONEditorProvider.prototype.requestEditor = function(a) {
  switch(a) {
    case "string":
      a = new SimpleStringEditor(void 0, this._classPrefix);
      break;
    case "number":
      a = new JSONNumberEditor(void 0, this._classPrefix);
      break;
    case "boolean":
      a = new JSONBooleanEditor(void 0, this._classPrefix);
      break;
    case "null":
      a = new JSONNullEditor(void 0, this._classPrefix);
      break;
    case "array":
      a = new JSONArrayEditor(void 0, this, this._classPrefix);
      break;
    case "object":
      a = new JSONObjectEditor(void 0, this, this._classPrefix);
      break;
    case "json":
      a = new JSONDynamicNode(void 0, this, this._classPrefix);
      break;
    case "text":
      a = new SimpleStringEditor(void 0, this._classPrefix);
      break;
    default:
      throw Error("unknown json type");;
  }
  return a;
};
DefaultJSONEditorProvider.prototype.disposeEditor = function(a) {
  a.getDom().detach();
};

