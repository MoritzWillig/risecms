cjson=require("json-stringify-safe");

/**
 * constructor for creating
 * new status prototypes/classes
**/
function Status(info) {
  this.info=info;
}

Status.prototype={
  //code:-1,
  //description:"",
  info:undefined,

  toString:function() {
    var res="["+this.code+" "+this.description+" ]";
    if (this.info!==undefined) { res+=" "+"<pre>"+escape(cjson(this.info,function(key,value) {
      if (value instanceof Buffer) { return value.toString(); }
      if ((value instanceof Array) && (value.length>=10)) { return "[|Array|>10]"; }
      
      return value;
    },2))+"</pre>"; }
    return res;
  }
};

function escape(str) {
  return str.replace(/</gi,"&lt;").replace(/>/gi,"&gt;");
}

/**
 * creates a new status class
 * this function is NOT part of the prototype as it is carried along with the constructors to prevent
 * deriving instances
**/
Status.derive=function(code,description) {
  if ((code!=undefined) && (status.codes[code])) {
    throw "Status code "+code+" was already assigned to an status";
  } else {
    function derivedStatus(info) { this.info=info; }
    derivedStatus.prototype = new this(undefined);
    derivedStatus.derive=this.derive;

    derivedStatus.prototype.code=code;
    derivedStatus.prototype.description=description;
    
    if (code!=undefined) {
      status.codes[code]=derivedStatus;
    }
    
    return derivedStatus;
  }
};



status={
  codes:{}, //list of codes codes[status.code]
  states:{},

  isSuccessfull:function(status) {
    var res=(
      status instanceof this.states.items   .OK ||
      status instanceof this.states.database.OK
    );
    return res;
  },

  toHTTP:function(data,status) {
    var statusCode;
    if (this.isSuccessfull(status)) {
      statusCode=200;
    } else {
      statusCode=404;
      data=status.toString();
    }

    return {
      code:statusCode,
      data:data
    };
  },
};

status.proto={
  users:Status.derive(undefined,"users proto"),
  item:{
    proto:Status.derive(undefined,"item proto")
  }
};

status.proto.item.valid  =status.proto.item.proto.derive(undefined,"valid item proto");
status.proto.item.success=status.proto.item.valid.derive(undefined,"success item proto");

status.states={ //tree hirachy of status codes
  items:{
    OK: Status.derive(200,"OK"),
    INVALID_PARENT: Status.derive(403,"An data item can not be used as parent"),
    NOT_FOUND: Status.derive(404,"Not Found - The item does not exist"),
    NO_FILE: Status.derive(406,"Not found - The file for the item was not found"),
    INVALID_ITEM_FILE: Status.derive(417,"Expectation Failed - This item has no parsable file"),
    UNKNOWN_RESOURCE_TYPE: Status.derive(405,"Method Not Allowed - The resource type does not exist"),
    ITEM_ERROR: Status.derive(500,"Internal Server Error - A required item could not be loaded"),

    NOT_LOADED: status.proto.item.valid.derive(501,"This item is not loaded"),
    HEADER_LOADED: status.proto.item.success.derive(502,"Item header was loaded"),
    FILE_LOADED:  status.proto.item.success.derive(503,"Item file was loaded"),
    INVALID_ID: Status.derive(504,"The id to be loaded was invalid"),
    HAS_NO_HEADER: Status.derive(505,"The given item type does not have a header"),
    
    UNKNOWN_VARIABLE_ROOT: Status.derive(506,"The variable root can not be found"),
    UNKNOWN_VARIABLE: Status.derive(507,"The variable does not exist"),
    INVALID_VARIABLE_TYPE: Status.derive(508,"The type can not be included as a variable"),
    ITEM_HAS_NO_CHILD: Status.derive(509,"The item has no child"),

    script:{
      TIMEOUT:Status.derive(550,"The script took to long to complete"),
      INVALID_TYPE:Status.derive(551,"The script did not return a string"),
      CRASH:Status.derive(552,"The script crashed")
    },

    static:{
      MISMATCHING_PARENTHESIS: status.proto.item.proto.derive(300,"Mismatching parenthesis in item text")
    }
  },
  database:{
    OK: Status.derive(1000,"OK"),
    DATABASE_ERROR:Status.derive(1001,"An database error ocurred"),
    INVALID_QUERY:Status.derive(1002,"The sent query was invalid")
  },
  system:{
    plugins:{
      UNKNOWN_EVENT:Status.derive(-1,"The event was not registered"),
      KNOWN_EVENT  :Status.derive(-2,"The event was already registered"),
    }
  },
  users:{
    IS_USER:status.proto.users.derive(-100,"The element is a user"),
    NO_USER:status.proto.users.derive(-101,"The element is no user"),
    NOT_AUTHENTICATED:status.proto.users.derive(-102,"The user was not authenticated")
  }
};


module.exports=status;