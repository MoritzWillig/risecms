
DebugWindowLayoutManager=function(parent) {
  this.layouts=[];
  this.activeLayout=undefined;
  this.displayedGUI=undefined;
  this.parent=parent;
}

DebugWindowLayoutManager.prototype.display=function(tab,layout) {
  if (this.activeLayout) {
    this.activeLayout.store();
    this.displayedGUI.detach();
  }
  this.activeLayout=undefined;

  layout=layout?layout:this.findLayout(tab);
  if (layout==undefined) {
    throw new Error("no matching layout found");
  }
  if (!layout.acceptsTab(tab)) {
    throw new Error("the layout does not accept the given tab");
  }

  this.activeLayout=layout;
  this.displayedGUI=this.activeLayout.getGUI(this.parent);
  this.parent.append(this.displayedGUI);

  this.activeLayout.display(tab);
}

DebugWindowLayoutManager.prototype.getActiveTab=function() {
  if (this.activeLayout) {
    return this.activeLayout.getActiveTab();
  }

  return undefined;
}

DebugWindowLayoutManager.prototype.findLayout=function(tab) {
  for (var i in this.layouts) {
    if (this.layouts[i].acceptsTab(tab)) {
      return this.layouts[i];
    }
  }
}

DebugWindowLayoutManager.prototype.store=function() {
  if (this.activeLayout) {
    this.activeLayout.store();
  }
}



DebugWindowLayout=function() {
}

DebugWindowLayout.prototype.acceptedTabTypes=[];

DebugWindowLayout.prototype.activeTab=undefined;

DebugWindowLayout.prototype.getGUI=function(gui) {
  throw new Error("not implemented");
}

DebugWindowLayout.prototype.display=function(tab) {
  throw new Error("not implemented");
}

DebugWindowLayout.prototype.getActiveTab=function() {
  return this.activeTab;
}

DebugWindowLayout.prototype.store=function() {
  throw new Error("not implemented");
}

DebugWindowLayout.prototype.acceptsTab=function(tab) {
  if (tab==undefined) { return true; }

  for (var i in this.acceptedTabTypes) {
    if (tab instanceof this.acceptedTabTypes[i]) {
      return true;
    }
  }
  return false;
}