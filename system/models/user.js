db=require("./database.js").getInstance();
cg=require("../../config.js");
stat=require("../../status.js");
bcrypt=require("bcryptjs");

user=function(name,callback) {
  this.status=new stat.states.users.NO_USER();

  if (name!==undefined) {
    this.loadByName(name,callback);
  } else {
    callback(this);
  }
};

user.prototype.name  ="";
user.prototype.groups=[];
user.prototype.authenticated=undefined;
user.prototype.data  =undefined;
user.prototype.status=undefined;

user.prototype.loadByName=function(name,callback) {
  that=this;
  db.query("\
    SELECT\
      ??.*,\
      GROUP_CONCAT(??.name SEPARATOR ',') groups\
    FROM\
      ??\
    JOIN\
      ??\
    ON ??.name=??.uname\
    WHERE\
      ??.name=?\
    GROUP BY\
      users.name;\
    ",[
    cg.database.usersTable,
    cg.database.groupsTable,
    cg.database.usersTable,
    cg.database.groupsTable,
    cg.database.usersTable,
    cg.database.groupsTable,
    cg.database.usersTable,
    name,
    cg.database.usersTable,
    ],function(err,data) {
      if (!err) {
        if (data[0]) {
          that.name=data[0].name;
          that.groups=(data[0].groups=="")?[]:data[0].groups.split(",");
          that.authenticated=undefined;
          that.data=data[0];
          that.status=new stat.states.users.IS_USER();
        } else {
          that.name="";
          that.groups=[];
          that.authenticated=undefined;
          that.data=undefined;
          that.status=new stat.states.users.NO_USER();
        }
      } else {
        that.status=new stat.states.database.DATABASE_ERROR({err:err,str:err.toString()});
      }
      if (callback) { callback(that); }
    });
};

user.prototype.isUser=function() {
  return ((this.status instanceof stat.states.users.IS_USER) && (this.authenticated!==false));
};

user.prototype.is=function(group) {
  return ((this.isUser()) && ((this.name===group) || (this.groups.indexOf(group)!=-1)));
};

user.prototype.authenticate=function(password) {
  this.authenticated=((this.isUser()) && (cryptCompare(password,this.data.password.toString())));
  return this.authenticated;
}

user.prototype.toString=function() {
  if (this.isUser()) {
    return "["+JSON.stringify({
      name:this.name,
      groups:this.groups,
      authenticated:this.authenticated
    })+"]";
  } else {
    return "[No user: "+this.status.toString()+"]";
  }
}

function cryptCompare(str,hash) {
  try {
    return bcrypt.compareSync(str,hash);
  } catch(e) {
    return false;
  }
}

module.exports=user;