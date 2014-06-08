
config={
  http:{
    host:"%http.host%",
    port:"%http.port%"
  },
  database:{
    host:"%db.host%",
    user:"%db.user%",
    password:"%db.password%",
    
    pageDb:"%db.pageDb%",
    pageTable:"%db.pageTable%",
    usersTable:"%db.users%",
    groupsTable:"%db.groups%"
  },
  session:{
    redis:{
      host:"localhost",
      port:6379,
      ttl:1*24*60*60, //1 day
      db:0,
      pass:undefined,
      prefix:"session_",
      secret:"984d8kz8ddnlsd"
    }
  },
  system:{
    parser:{
      undef_item_is_error:true
    }
  },
  plugins:{
    editor:{
      //give admin permission to use the editor
      users:["admins"]
    }
  }
};



module.exports=config;
