const {User} = require('../models/index')

module.exports = {
    Query: {
      getUsers: async() => {
        try{
          const users =await  User.findAll();

          return users;
        }catch(error){
          console.log(error)
        }
      }
    },
  };