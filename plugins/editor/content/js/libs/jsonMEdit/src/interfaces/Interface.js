
/**
 * Error class for interfaces
 * @class
 * @extends {Error}
 * @param {string} message message of the error
 */
function InterfaceError(message) {
  Error.prototype.constructor.apply(this,arguments);
  this.name="InterfaceError";
  this.message=message;
}

InterfaceError.prototype=Error.prototype;

/**
 * Generic Interface class
 * @class
 */
function Interface() {
  //tripple underscore: _ for class internal, __ for browsers, ...
  Object.defineProperty(this,"___interfaces",{
    enumerable:false,
    value:[this]
  });
}

/**
 * wrapp a function and mark it as an interface function
 * @static
 * @param {function} func     function to wrap
 * @param {boolean} optional states wether or not the implementation is required (false) or optional (true)
 * @returns {function} the parameter func
 */
Interface.IfcFunc=function IfcFunc(func,optional) {
  if (optional==undefined) { optional=false; }

  Object.defineProperty(func,"___ifcFunc",{
    enumerable:false,
    value:{optional:optional}
  });

  return func;
}

function isInstanceOf(inst,type) {
  return (inst instanceof type);
}

Object.defineProperty(Interface.prototype,"$include",{
  configurable:false,
  enumerable:false,
  /**
   * @this {Interface}
   * include an interface into this interface
   * @param  {Interface} interface interface to include
   */
  value:function $include(iinterface) {
    if ((isInstanceOf(iinterface,Interface.constructor))==false) {
      throw new Error("trying to include a non interface object");
    }

    for (var i in iinterface.prototype) {
      //test if the attribute already exists
      if (i in this) {
        throw new Error("attribute already exists");
      }

      this[i]=iinterface.prototype[i];
    }

    /* we do not need to remove duplicates. because, on other than
     * empty interfaces, we would throw an error for duplicate attributes
     * in the code above.
     * TODO: check for empty interfaces
     */
    Array.prototype.push.apply(this.___interfaces,iinterface.___interfaces);
  }
});

Object.defineProperty(Interface.prototype,"$includes",{
  configurable:false,
  enumerable:false,
  /**
   * @this {Interface}
   * check if an interface is included into the current interface
   * @param  {Interface} interface interface to check
   */
  value:function $includes(iinterface) {
    return (this.___interfaces.indexOf(iinterface.prototype)!=-1);
  }
});

Object.defineProperty(Interface.prototype,"$fromInterface",{
  configurable:false,
  enumerable:false,
  /**
   * @this {Interface}
   * checks if a property was introduced by an interface
   * @param  {string} name name of the property
   * @return {Boolean}      true if an interface introduced the property, false otherwise
   */
  value:function $fromInterface(name) {
    //interface functions are required to be passed throught IfcFunc
    return ((this[name]) && (this[name].___ifcFunc));

    /*
    for (var i in this.___interfaces) {
      var ifc=this.___interfaces[i];



      for (var i in ifc) {
        if (i==name) {
          return true;
        }
      }
    }
    return false;
    */
  }
});

Object.defineProperty(Interface,"$test",{
  configurable:false,
  enumerable:false,
  /**
   * @this {Interface}
   * test if every required method of an interface is implemented
   * @param  {Interface} interfaceUUTInst interface to test
   * @param  {Interface}  interface interface to compare to
   * @return {Array}              array containing all methods that are missing
   */
  value:function $test(interfaceUUTInst, iinterface) {
    var notImplemented=[];

    for (var i in iinterface.prototype) {
      //check if the method was overwritten
      if (interfaceUUTInst[i]===iinterface.prototype[i]) {
        //check if the method is optional -> body is empty -> no error
        try {
          iinterface.prototype[i]();
        } catch(e) {
          if (e instanceof InterfaceError) {
            notImplemented.push(i);
          } else {
            throw new Error("caught an error which was no instance of InterfaceError");
          }
        }
      }
    }

    return notImplemented;
  }
});

/**
 * helper for merging classes derived from interfaces
 */
function ClassHelper() {}

Object.defineProperty(ClassHelper,"$merge",{
  configurable:false,
  enumerable:false,
  /**
   * @this {ClassHelper}
   * merges an class into another
   *
   * notice that this does merging does include the constructor call of the included class
   * to do this call NAMEOFINCLUDEDCLASS.apply(this);
   * @param  {class} to         class to merge to
   * @param  {class} from       class to merge into the to class
   * @param  {boolean} overwrite wether or not existing function should be overwritten (interface placeholder function are always overwritten)
   */
  value:function $merge(to,from,overwrite) {
    if (overwrite==undefined) {
      overwrite=false;
    }

    for (var i in from.prototype) {
      //test if the attribute already exists
      if (i in to.prototype) {
        //check if the function is
        if ((!to.prototype.$fromInterface(i)) && (!overwrite)) {
          throw new Error("attribute already exists: "+i);
        }
      }

      to.prototype[i]=from.prototype[i];
    }
  }
});