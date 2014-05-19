
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
    pageTable:"%db.pageTable%"
  },
  system:{
    parser:{
      undef_item_is_error:true
    }
  }
};



module.exports=config;
