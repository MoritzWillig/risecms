db=require("./database.js").getInstance();
cg=require("../../config.js");
stat=require("../../status.js");

user=function(name,callback) {
  this.status=new stat.states.users.NO_USER();

  if (name!==null) {
    this.loadByName(name,callback);
  }
};

user.prototype.name  ="";
user.prototype.groups=[];
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
    name
    ],function(err,data) {
      if (!err) {
        if (data[0]) {
          that.name=data[0].name;
          that.groups=data[0].groups;
          that.status=new stat.states.users.IS_USER();
        } else {
          that.name="";
          that.groups=[];
          that.status=new stat.states.users.NO_USER();
        }
      } else {
        that.status=new stat.states.database.DATABASE_ERROR({err:err,str:err.toString()});
      }
      callback(that);
    });
};

user.prototype.isUser=function() {
  return (this.status instanceof stat.states.users.IS_USER);
};

user.prototype.is=function(group) {
  return ((this.isUser()) && ((this.name===group) || (this.groups.indexOf(group)!=-1)));
};

module.exports=user;