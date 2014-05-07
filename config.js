
config={
  http:{
    port:8800
  },
  database:{
    host:"localhost",
    user:"user",
    password:"test",
    
    pageDb:"test",
    pageTable:"items"
  },
  system:{
    parser:{
      undef_item_is_error:true
    }
  }
};



module.exports=config;
