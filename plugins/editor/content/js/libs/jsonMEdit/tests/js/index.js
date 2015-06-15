
testIEditorProvider=function(name,genInstance,acceptedConstants,rejecetedConstants) {
  QUnit.module(name,{
    beforeEach:function(assert) {
      //create editorProvider
      this.editorProvider=genInstance();
    },
    afterEach:function(assert) {
    }
  });

  QUnit.test("interface",function(assert) {
    var missing=Interface.$test(this.editorProvider,IEditorProvider);
    assert.deepEqual(
      missing,
      [],
      "IEditor interface is not implemented (missing: "+missing.join(", ")+")");
  });

  //teste correct creation and disposal of editors
  for (var i in acceptedConstants) {
    QUnit.test("create/dispose no throw",function(assert) {
      var instance=this.editorProvider.requestEditor(acceptedConstants[i]);
      this.editorProvider.disposeEditor(instance);

      assert.ok(true,"did not throw");
    });

    QUnit.test("creates editor",function(assert) {
      var instance=this.editorProvider.requestEditor(acceptedConstants[i]);

      assert.equal(instance.$includes(IEditor),true,"instance does include IEditorProvider");

      this.editorProvider.disposeEditor(instance);
    });

    QUnit.test("rejeceted constant throw",function(assert) {
      assert.throws(function() {
        this.editorProvider.requestEditor(rejecetedConstants);
      },Error,"rejeceted constant did not throw");

    });
  }

};

testIEventHandler=function(name,genInstance,values) {
  QUnit.module(name,{
    beforeEach:function(assert) {
      //create eventHandler
      this.eventHandler=genInstance();

      this.registeredEvents={};
      this.triggerCt=0;

      //create some handlers
      this.handlers=[];
      var self=this;
      for (var i=0; i<5; i++) {
        this.registeredEvents[i]=[];

        var handler=(function(n) {
          return function handler() {
            self.triggerCt++;
            var argsArr=[];
            for (var i=0; i<arguments.length; i++) {
              argsArr.push(arguments[i]);
            }
            self.registeredEvents[n].push(argsArr);
          }
        })(i);

        this.handlers.push(handler);
      }

      this.registerAll=function() {
        for (var i=0; i<this.handlers.length; i++) {
          this.eventHandler.register(this.handlers[i]);
        }
      }
    },
    afterEach:function(assert) {
    }
  });

  QUnit.test("interface",function(assert) {
    var missing=Interface.$test(this.eventHandler,IEventHandler);
    assert.deepEqual(
      missing,
      [],
      "IEditor interface is not implemented (missing: "+missing.join(", ")+")");
  });

  QUnit.test("reg/unreg no throw",function(assert) {
    this.registerAll();

    for (var i=3; i<3+this.handlers.length; i++) {
      this.eventHandler.unregister(this.handlers[i%this.handlers.length]);
    }

    assert.ok(true,"did not throw");
  });

  QUnit.test("reg/clear no throw",function(assert) {
    this.registerAll();

    this.eventHandler.clear();

    assert.ok(true,"did not throw");
  });

  QUnit.test("reg/unreg isRegistered",function(assert) {
    this.registerAll();

    //start unregistering in the middle of the handler array
    for (var i=3; i<3+this.handlers.length; i++) {
      this.eventHandler.unregister(this.handlers[i%this.handlers.length]);

      //check that the handler was unregistered
      assert.equal(
        this.eventHandler.isRegistered(this.handlers[i%this.handlers.length]),
        false,
        "handler "+(i%this.handlers.length)+" is unregistered");

      //check that every other handler is still registered
      for (var j=i+1; j<3+this.handlers.length; j++) {
        assert.equal(
          this.eventHandler.isRegistered(this.handlers[j%this.handlers.length]),
          true,
          "handler "+(j%this.handlers.length)+" is registered");
      }
    }
  });

  QUnit.test("reg/clear isRegistered",function(assert) {
    this.registerAll();

    this.eventHandler.clear();

    for (var i=0; i<this.handlers.length; i++) {
      //check that the handler was unregistered
      assert.equal(
        this.eventHandler.isRegistered(this.handlers[i]),
        false,
        "handler "+i+" is unregistered");
    }
  });

  QUnit.test("reg/unreg twice isRegistered",function(assert) {
    //first run
    this.registerAll();

    //start unregistering in the middle of the handler array
    //do not remove all handlers in the first run (leave 2 registered)
    for (var i=3; i<1+this.handlers.length; i++) {
      this.eventHandler.unregister(this.handlers[i%this.handlers.length]);

      //check that the handler was unregistered
      assert.equal(
        this.eventHandler.isRegistered(this.handlers[i%this.handlers.length]),
        false,
        "handler "+(i%this.handlers.length)+" is unregistered");

      //check that every other handler is still registered
      for (var j=i+1; j<3+this.handlers.length; j++) {
        assert.equal(
          this.eventHandler.isRegistered(this.handlers[j%this.handlers.length]),
          true,
          "handler "+(j%this.handlers.length)+" is registered");
      }
    }

    //second run
    //notice the still registered handlers - do not add them again
    for (var i=3; i<1+this.handlers.length; i++) {
      this.eventHandler.register(this.handlers[i%this.handlers.length]);
    }

    //start unregistering in the middle of the handler array
    for (var i=3; i<3+this.handlers.length; i++) {
      this.eventHandler.unregister(this.handlers[i%this.handlers.length]);

      //check that the handler was unregistered
      assert.equal(
        this.eventHandler.isRegistered(this.handlers[i%this.handlers.length]),
        false,
        "handler "+(i%this.handlers.length)+" is unregistered");

      //check that every other handler is still registered
      for (var j=i+1; j<3+this.handlers.length; j++) {
        assert.equal(
          this.eventHandler.isRegistered(this.handlers[j%this.handlers.length]),
          true,
          "handler "+(j%this.handlers.length)+" is registered");
      }
    }
  });

  QUnit.test("reg/clear twice isRegistered",function(assert) {
    //first run
    this.registerAll();

    this.eventHandler.clear();

    for (var i=0; i<this.handlers.length; i++) {
      //check that the handler was unregistered
      assert.equal(
        this.eventHandler.isRegistered(this.handlers[i]),
        false,
        "handler "+i+" is unregistered");
    }

    //second run
    this.registerAll();

    this.eventHandler.clear();

    for (var i=0; i<this.handlers.length; i++) {
      //check that the handler was unregistered
      assert.equal(
        this.eventHandler.isRegistered(this.handlers[i]),
        false,
        "handler "+i+" is unregistered");
    }
  });

  QUnit.test("trigger",function(assert) {
    this.registerAll();

    var testObj={1:"a","test":"x","test2":null,"test3":[1,2,3]};
    var testArr=[1,"a",null,{"a":"b"},[1,2,3]];
    this.eventHandler.trigger(1,null,testObj,testArr);

    assert.equal(
      this.triggerCt,
      this.handlers.length,
      "amount of registered events differs"
      );

    for (var i=0; i<this.handlers.length; i++) {
      assert.equal(
        this.registeredEvents[i].length,
        1,
        "handler "+i+" registered a different number of events"
        );

      assert.deepEqual(
        this.registeredEvents[i][0],
        [
          1,
          null,
          testObj,
          testArr
        ],
        "handler "+i+" recived different data"
      );
    }
  });

  QUnit.test("empty clear no throw",function(assert) {
    //clear everything if not already empty
    this.eventHandler.clear();

    //clear asd
    this.eventHandler.clear();

    assert.ok(true,"did not crash");
  });

  QUnit.test("register twice throw",function(assert) {
    this.eventHandler.register(this.handlers[0]);
    assert.throws(function() {
      this.eventHandler.register(this.handlers[0])
    },Error,"registered handler twice but did not throw");

    this.eventHandler.unregister(this.handlers[0]);
    assert.equal(
      this.eventHandler.isRegistered(this.handlers[0]),
      false,
      "handler was registered twice"
      );
  });

  QUnit.test("unregister throw",function(assert) {
    assert.throws(function() {
      this.eventHandler.unregister(this.handlers[0])
    },Error,"unregistering an unregistered handler did not throw");
  });

  /* test the given functions for (not) triggering the event handler
   */
  for (var i in values) {
    var val=values[i];
    (function(val) {
      QUnit.test("trigger test_"+i, function (assert) {
        this.registerAll();

        val.setup(this.eventHandler,function reset() {
          //function reset trigger counter
          this.triggerCt=0;
          for (var i=0; i<5; i++) {
            this.registeredEvents[i]=[];
          }
        }); // does (not) call trigger

        assert.equal(((!val.shouldTrigger) && (this.triggerCt!=0)),false,"registered event which should not have been triggered");
        assert.equal(((val.shouldTrigger) && (this.triggerCt!=5)),false,"registered no event which should have been occured");

        if (val.post) {
          val.post(this.registeredEvents,this.triggerCt);
        }
      });
    })(val);
  }
}

/**
 * tests an implementation of the IEditor interface for its correct implementation
 * @param  {string} name        name of the test
 * @param  {function} genInstance function which returns a new instance of the implementation
 * @param  {object} values      object with {value:x,result:y} pairs, were x is the value to set and y the expected input
 */
testIEditor=function(name,genInstance,values) {
  var data={
    setUndefined:{
      setup:function(instance,reset) {
        instance.setValue(undefined);
      },
      shouldTrigger:true
    },
    setReadOnly:{
      setup:function(instance,reset) {
        instance.setReadOnly(false);
        instance.setReadOnly(true);
      },
      shouldTrigger:false
    }
  };

  //create tests for every test value
  for (var i in values) {
    (function(name) {
      data["set"+name]={
        setup:function(instance,reset) {
          instance.setValue(values[name].value);
        },
        shouldTrigger:true
      };
    })(i);
  }
  testIEventHandler(name+".IEventHandler",genInstance,data);

  QUnit.module(name,{
    beforeEach:function(assert) {
      //create editor
      this.editor=genInstance();
    },
    afterEach:function(assert) {
    }
  });

  /* test that the IEditor interface is implemented
   */
  QUnit.test("interface",function(assert) {
    var missing=Interface.$test(this.editor,IEditor);
    assert.deepEqual(
      missing,
      [],
      "IEditor interface is not implemented (missing: "+missing.join(", ")+")");
  });

  /* test if getDom works
   */
  QUnit.test("getDom", function (assert) {
    //modify gui & append to document
    var dom=this.editor.getDom();

    assert.notEqual(dom,undefined);
  });

  QUnit.test("get value undefined", function (assert) {
    var value=this.editor.getValue();

    //should be undefined, because we did not set a value
    assert.equal(value,undefined,"got an result in an error state");
  });

  QUnit.test("get value set undefined", function (assert) {
    //set a valid value first
    this.editor.setValue(values.simple.value);
    //set to undefined after
    this.editor.setValue(undefined);

    var value=this.editor.getValue();

    //should be undefined, because we did not set a value
    assert.equal(value,undefined,"got an result in an error state");
  });

  /* test the given values
   */
  for (var i in values) {
    var val=values[i];
    (function(val) {
      QUnit.test("set get value test_"+i, function (assert) {
        this.editor.setValue(val.value);
        var value=this.editor.getValue();

        assert.deepEqual(value,val.result,"recived a modified value from the editor");
      });
    })(val);
  }
}


testIEventHandler("EventHandler",function() { return new EventHandler(); },{
  //no other functions to test trigger with
});


var test_obj={
  name:"list1",
  items:[
    100.5,
    123.3,
    433.3,
    [
      32E2,
      "test",
      {
        "4":true
      }
    ]
  ],
  filepath:null
};

/*
//operates with json strings
testIEditor("JSONEditor"        ,function() { return new JSONEditor();         },{
  simple:default_obj,
  complex:test_obj
});
*/
//operates with json objects
testIEditor("JSONArrayEditor"   ,function() {
  var provider=new DefaultJSONEditorProvider();
  return new JSONArrayEditor(undefined,provider);
},{
  simple:{
    value:[],
    result:[]
  },
  complex:{
    value:[1,undefined,"test",3.3,null],
    result:[1,undefined,"test",3.3,null]
  }
});

testIEditor("JSONObjectEditor"  ,function() {
  var provider=new DefaultJSONEditorProvider();
  return new JSONObjectEditor(undefined,provider);
},{
  simple:{
    value:{},
    result:{}
  },
  complex:{
    value:test_obj,
    result:test_obj
  }
});

testIEditor("JSONNullEditor"  ,function() { return new JSONNullEditor(); },{
  simple:{
    value:null,
    result:null
  },
  error:{
    value:"433io",
    result:undefined
  }
});

testIEditor("JSONNumberEditor"  ,function() { return new JSONNumberEditor(); },{
  simple:{
    value:0,
    result:0
  },
  complex:{
    value:45,
    result:45
  },
  error:{
    value:"433io",
    result:undefined
  }
});

testIEditor("JSONBooleanEditor",function() { return new JSONBooleanEditor(); },{
  simple:{
    value:true,
    result:true
  },
  complex:{
    value:false,
    result:false
  },
  false:{
    value:true,
    result:true
  }
});

testIEditor("SimpleStringEditor",function() { return new SimpleStringEditor(); },{
  simple:{
    value:"",
    result:""
  },
  complex:{
    value:"123 QWERwe_.$",
    result:"123 QWERwe_.$"
  }
});
//operates with multiple json object types
testIEditor("JSONDynamicNode"      ,function() {
  var provider=new DefaultJSONEditorProvider();
  return new JSONDynamicNode(undefined,provider);
},{
  simple:{
    value:{},
    result:{}
  },

  simple_obj:{
    value:{},
    result:{}
  },
  complex_obj:{
    value:test_obj,
    result:test_obj
  },

  simple_arr:{
    value:[],
    result:[]
  },
  complex_arr:{
    value:[test_obj,"string",[1,2,3,"4"],null],
    result:[test_obj,"string",[1,2,3,"4"],null]
  },

  simple_num:{
    value:0,
    result:0
  },
  complex_num:{
    value:123.321E2,
    result:123.321E2
  },

  simple_str:{
    value:"",
    result:""
  },
  complex_str:{
    value:"test1 test2 \n test3",
    result:"test1 test2 \n test3"
  },

  simple_null:{
    value:null,
    result:null
  }
});

testIEditorProvider("DefaultJSONEditorProvider",function() { return new DefaultJSONEditorProvider(); },[
  "string","number","null","array","object","boolean","json","text"
],[
  undefined,"undefined",null,"null","",0,1234,"abc"
]);