
config={
  http:{
    host:"%http.host%", //internal address to bind the server to
    port:"%http.port%",
    gateway:"http://%https.host%" //public url
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
      secret:"%session.secret%"
    }
  },
  system:{
    parser:{
      undef_item_is_error:true
    },
    request:{
      items:{
        //timeouts for composing items (mainly used to prevent item scripts from running to long)
        sync_timeout:1000,
        async_timeout:1000
      }
    },
    plugins:["editor","auth"]
  },
  plugins:{
    editor:{
      //give admin permission to use the editor
      users:["admins"]
    }
  }
};



module.exports=config;
