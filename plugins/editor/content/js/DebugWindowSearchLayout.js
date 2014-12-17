DebugWindowSearchLayout=function(loadRequest) {
  DebugWindowLayout.apply(this,[]);

  this.loadRequest=loadRequest;

  this.gui={
    layout:undefined,
    itemList:undefined,
    activeElements:[],
    header:{}
  };

  this._results=undefined;

  var self=this;

  //TODO clean up css classes

  //setup header
  this.gui.headerRow=debugWindow.gui.elements.tr.clone().addClass("editScreenTitleDesc");
  var headerColumns=[];
  for (var i in editorAPI.headerColumns) {
    var column=debugWindow.gui.elements.td.clone().text(editorAPI.headerColumns[i]);
    headerColumns.push(column);
  }
  var editColumn=debugWindow.gui.elements.td.clone().text("");
  headerColumns.push(editColumn);
  this.gui.headerRow.append(headerColumns);

  var triggerAction=function(e) {
    if (e.keyCode==13) {
      self._search();
    }
  }

  var filterRow=debugWindow.gui.elements.tr.clone();
  for (var i in editorAPI.headerColumns) {
    var column=debugWindow.gui.elements.td.clone();
    filterRow.append(column);

    switch (editorAPI.headerType[i]) {
    case "string":
      var edit=debugWindow.gui.elements.input.clone().addClass("editScreenHead").keypress(triggerAction);
      column.append(edit);
      this.gui.header[editorAPI.headerColumns[i]]=edit;
      break;
    case "int":
    case "timestamp":
      //allow range queries for nummeric types
      var editStart=debugWindow.gui.elements.input.clone().addClass("editScreenHead").keypress(triggerAction);
      column.append(editStart);
      var editEnd=debugWindow.gui.elements.input.clone().addClass("editScreenHead").keypress(triggerAction);
      column.append(editEnd);
      
      this.gui.header[editorAPI.headerColumns[i]]=[editStart,editEnd];
      break;
    default:
      throw new Error("unknown data type "+editorAPI.headerType[i]);
    }
  }

  filterRow.append(
    debugWindow.gui.elements.button.clone().text("search").click(function() {
      self._search();
    })
  );

  this.gui.headerGui=debugWindow.gui.elements.table.clone().addClass("editScreenHeader").append([
    this.gui.headerRow.clone(),
    filterRow
  ]);

  this.gui.headerWrapper=debugWindow.gui.elements.div.clone().addClass("editScreenHeaderWrapper").append(
    this.gui.headerGui
  );


  //create result table
  this.gui.results=debugWindow.gui.elements.table.clone().addClass("fullLineTable").append(
    this.gui.headerRow.clone()
  );

  
  this.gui.resultsWrapper=debugWindow.gui.elements.div.clone().addClass("editScreenResultsWrapper").append(
    this.gui.results
  ).removeClass("editScreenHeader").addClass("editScreenResultsTable");


  //build layout
  this.gui.layout=debugWindow.gui.elements.div.clone().append([
    this.gui.headerWrapper,
    this.gui.resultsWrapper
  ]).css("height","100%");
};

DebugWindowSearchLayout.prototype=new DebugWindowLayout();

DebugWindowSearchLayout.prototype.acceptedTabTypes=[DebugWindowSearchTab];

DebugWindowSearchLayout.prototype.getGUI=function() {
  return this.gui.layout;
}

DebugWindowSearchLayout.prototype.display=function(tab) {
  this.reset();

  //load new tab
  this.activeTab=tab;
  
  if (this.activeTab!=undefined) {
    var self=this;
    this.activeTab.getHeader(function(header) {
      //fill header
      for (var i in editorAPI.headerColumns) {
        switch (editorAPI.headerType[i]) {
        case "string":
          self.gui.header[editorAPI.headerColumns[i]].val(header[editorAPI.headerColumns[i]]);
          break;
        case "int":
        case "timestamp":
          self.gui.header[editorAPI.headerColumns[i]][0].val(header[editorAPI.headerColumns[i]][0]);
          self.gui.header[editorAPI.headerColumns[i]][1].val(header[editorAPI.headerColumns[i]][1]);
          break;
        }
      }
    });

    this._updateResults();
  }
}

DebugWindowSearchLayout.prototype.store=function() {
  if (this.activeTab!=undefined) {
    this.activeTab.setHeader(this._getHeader());
    this.activeTab.setResults(this._getResults());
  }
}

DebugWindowSearchLayout.prototype._getHeader=function() {
  if (this.activeTab) {
    var header={};

    for (var i in editorAPI.headerColumns) {
      switch (editorAPI.headerType[i]) {
      case "string":
        header[editorAPI.headerColumns[i]]=this.gui.header[editorAPI.headerColumns[i]].val();
        break;
      case "int":
      case "timestamp":
        header[editorAPI.headerColumns[i]]=[
          this.gui.header[editorAPI.headerColumns[i]][0].val(),
          this.gui.header[editorAPI.headerColumns[i]][1].val()
        ];
        break;
      }
    }
    return header;
  } else {
    throw new Error("no active tab");
  }
};

DebugWindowSearchLayout.prototype._getResults=function() {
  if (this.activeTab) {
    return this._results;
  } else {
    throw new Error("no active tab");
  }
}

DebugWindowSearchLayout.prototype.reset=function(message) {
  //store current tab
  this.store();
  this.activeTab=undefined;

  this.setReadOnly(true);

  //clear search forms
  for (var i in editorAPI.headerColumns) {
    switch (editorAPI.headerType[i]) {
      case "string":
        this.gui.header[editorAPI.headerColumns[i]].val("");
        break;
      case "int":
      case "timestamp":
        this.gui.header[editorAPI.headerColumns[i]][0].val("");
        this.gui.header[editorAPI.headerColumns[i]][1].val("");
        break;
    }
  }

  this._clearResults();
}

DebugWindowSearchLayout.prototype._clearResults=function() {
  this._results=undefined;
  this.gui.results.empty().append(
    this.gui.headerRow.clone()
  );
}

DebugWindowSearchLayout.prototype.setReadOnly=function(readOnly) {
  $(this.gui.activeElements).each(function() {
    this.prop("disabled",readOnly);
  });
}

DebugWindowSearchLayout.prototype._search=function() {
  if (this.activeTab) {
    var tab=this.activeTab;
    this.store();

    var self=this;
    tab.updateResults(function(data,valid) {
      if (!valid) {
        //another request was send or the header was changed, discard this query
        return;
      }

      tab.setResults(data);
      if (tab==self.activeTab) {
        self._updateResults();
      }
    });
  } else {
    throw new Error("no active tab");
  }
}

DebugWindowSearchLayout.prototype._updateResults=function() {
  this._clearResults();

  var self=this;
  if (this.activeTab) {
    //set results
    this.activeTab.getResults(function(results) {
      var rows=[];
      self._results=results;

      for (var i in results) {
        var result=results[i];

        var row=debugWindow.gui.elements.tr.clone();
        rows.push(row);
        for (var j in editorAPI.headerColumns) {
          var column=debugWindow.gui.elements.td.clone();
          row.append(column);
          
          column.text(result[editorAPI.headerColumns[j]]);
        }

        var column=debugWindow.gui.elements.td.clone();
        var button=debugWindow.gui.elements.button.clone().text("edit").click((function(id) {
          return function() {
            self._editItem(id);
          };
        })(result["id"]));
        column.append(button);
        row.append(column);
      }

      self.gui.results.append(rows);
    });
  }
}

DebugWindowSearchLayout.prototype._editItem=function(id) {
  if (this.activeTab) {
    var self=this;

    this.store();
    self.loadRequest(id);
  } else {
    throw new Error("no active tab");
  }
}