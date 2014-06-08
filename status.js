
/**
 * constructor for creating
 * new status prototypes/classes
**/
function Status(code,description) {
  this.code=code;
  this.description=description;
}

Status.prototype={
  code:-1,
  description:"",
  info:undefined,

  toString:function() {
    var res="["+this.code+" "+this.description+" ]";
    if (this.info!==undefined) { res+=" "+"<pre>"+JSON.stringify(this.info,undefined,2)+"</pre>"; }
    return res;
  }
};

/**
 * creates a new status class
**/
Status.derive=function(code,statusName) {
  if ((code==undefined) && (status.codes[code])) {
    throw "Status code "+code+" was already assigned to an status";
  } else {
    function derivedStatus(info) { this.info=info; }
    derivedStatus.derive=Status.derive;
    derivedStatus.prototype = new Status(code,statusName);

    status.codes[code]=derivedStatus;
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

};

status.states={ //tree hirachy of status codes
  items:{
    OK: Status.derive(200,"OK"),
    NOT_FOUND: Status.derive(404,"Not Found - The item does not exist"),
    INVALID_ITEM_FILE: Status.derive(417,"Expectation Failed - This item has no parsable file"),
    UNKNOWN_RESOURCE_TYPE: Status.derive(405,"Method Not Allowed - The resource type does not exist"),
    ITEM_ERROR: Status.derive(500,"Internal Server Error - A required item could not be loaded")
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
    NO_USER:status.proto.users.derive(-101,"The element is no user")
  }
};


module.exports=status;