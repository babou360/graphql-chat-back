const {User} = require('../models/index')
const bcrypt = require('bcryptjs')
const {UserInputError} = require('apollo-server')

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

    Mutation: {
      register: async(_,args) => {
        let {username, email, password} = args
        let errors ={}

        try{
          if(email.trim() === '') errors.email = 'email cannot be empty'
          if(username.trim() === '') errors.username = 'username cannot be empty'
          if(password.trim() === '') errors.password = 'password cannot be empty'

          const userbyName = await User.findOne({where: {username}})
          const userbyEmail = await User.findOne({where: {email}})

          if(userbyName) errors.username = 'username is taken'
          if(userbyEmail) errors.email = 'email is taken'

          if(Object.keys(errors).length > 0){
            throw errors
          }

          password = await bcrypt.hash(password,6)
          const user = await User.create({
            username,
            email,
            password
          })
          return user;

        }catch(err){
          throw new  UserInputError('Bad input',{errors: err})
        }
      }
    }
  };