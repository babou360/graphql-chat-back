const {User} = require('../models/index')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {JWT_SECRET} = require('../config/env.json')
const {UserInputError,AuthenticationError} = require('apollo-server')
const {Op} = require('sequelize')

module.exports = {
    Query: {
      getUsers: async(_,__,context) => {
        try{
          let user
          if(context.req && context.req.headers.authorization) {
            const token = context.req.headers.authorization.split('Bearer ')[1]
            jwt.verify(token,JWT_SECRET, (error,decodedToken) => {
              if(error){
                throw new AuthenticationError('unauthenticated')
              }
              user = decodedToken
            })
          }
          const users =await  User.findAll({
            where: {username: {[Op.ne]: user.username}}
          });

          return users;
        }catch(error){
          console.log(error)
          throw error
        }
      },
      login: async(_,args) => {
        const {username,password} = args
        let errors = {}
        
        try{
          if(username.trim() === '') errors.username = 'username cannot be empty'
          if(password.trim() === '') errors.password = 'password cannot be empty'

          if(Object.keys(errors).length > 0){
            throw new AuthenticationError('bad input',{errors})
          }

            const user = await User.findOne({
                where: {username}
            })
            if(!user){
              errors.username = 'user not found'
              throw new UserInputError('user not found',{errors})
            }
            const correctPassword = await bcrypt.compare(password,user.password)

            if(!correctPassword){
              errors.password = 'password is not correct'
              throw new AuthenticationError('password not correct',{errors})
            }

            const token = jwt.sign({username},JWT_SECRET, {expiresIn: '1y'})
            user.token = token
            return {
              ...user.toJSON(),
              createdAt: user.createdAt.toISOString(),
              token
            }
        }catch(err){
            console.log(err)
            throw err
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