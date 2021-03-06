var express = require('express');
var router = express.Router();
var User = require('../models/user');
const bodyParser = require('body-parser');
var passport = require('passport');
const cors = require('./cors');
var authenticate = require('../authenticate');
router.use(bodyParser.json());

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => {res.sendStaus(200);})
router.get('/', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.find({})
    .then((users) => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(users);
    })
    .catch((err) => next(err));
});
/*
router.post('/signup',(req, res, next) => {
    console.log('Processing');
    User.findOne({username:req.body.username})
    .then((user)=>{
        console.log('entered');
        if(user != null){
            console.log('err be created');
            var err = new Error('User '+ req.body.username+' already exists');
            err.status = 403;
            next(err);
        }else{
            console.log('will be created');
            return User.create({
                username: req.body.username,
                password: req.body.password
            });
        }
    })
    .then((user) => {
        console.log('Registration Successful !!');
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json({status:'Registration Successful !!', user:user});

    },(err) => next(err))
    .catch((err)=> {
        console.log('Error occured');
        next(err);
    });
});

router.post('/login',(req, res, next) => {
    if(!req.session.user){
        var authHeader = req.headers.authorization;

        if(!authHeader){
            var err = new Error('You are not authenticated');
            res.setHeader('WWW-Authenticate', 'Basic');
            err.status = 401;
            return next(err);
        }

        var auth = new Buffer.from(authHeader.split(' ')[1],'base64').toString().split(':');
        var username = auth[0];
        var password = auth[1];

        User.findOne({username:username})
        .then((user)=>{
            if(user === null){
                var err = new Error('user '+ username + ' does not already exists');
                err.status = 403;
                return next(err);
            }else if(user.password !== password){
                    var err = new Error('Your password is incorrect');
                    err.status = 403;
                    return next(err);
            }else if(user.username === username && user.password === password){
                    // res.cookie('user','admin',{signed:true});
                    req.session.user = 'authenticated';
                    res.statusCode = 200;
                    res.setHeader('Content-Type','text/plain');
                    res.end('You are authenticated');
            }
        }).catch((err) => next(err));
    }else{
        res.statusCode = 200;
        res.setHeader('Content-Type','text/plain');
        res.end('You are already authenticated');
    }
});
*/

router.post('/signup', (req, res, next) => {
  User.register(new User({username: req.body.username}),
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
        if(req.body.firstname)
            user.firstname = req.body.firstname;
        if(req.body.lastname)
            user.lastname = req.body.firstname;
        user.save((err,user) =>{
            if(err){
                res.statusCode = 500;
                res.setHeader('Content-Type','application/json')
                res.json({err:err});
                return ;
            }
            passport.authenticate('local', (req, res, next) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json({success: true, status: 'Registration Successful!'});
        });
      });
  }
  });
});

/*
router.post('/login', passport.authenticate('local'), (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, status: 'You are successfully logged in!'});
});
*/

router.post('/login',cors.corsWithOptions, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
      if(err){
          return next(err);
      }
      if(!user){
          res.statusCode = 401;
          res.setHeader('Content-Type','application/json');
          res.json({success: false, status: 'You are not authenticated!!',err: info});
      }
      req.logIn(user, (err) => {
          if(err){
              res.statusCode = 401;
              res.setHeader('Content-Type','application/json');
              res.json({success: false, status: 'You are not authenticated!!',err: info});
          }

          var token = authenticate.getToken({_id: req.user._id});
          res.statusCode = 200;
          res.setHeader('Content-Type','application/json');
          res.json({success: true, status: 'Logged In!!',token: token});
      });
  })(req, res, next);
});

router.get('/logout', (req, res )=>{
    if(req.session){
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    }else{
        var err = new Error('You are not logged in !!');
        res.status = 403;
        next(err);
    }
});

router.get('/facebook/token',passport.authenticate('facebook-token'),(req, res) =>{
    if(req.user){
        var token = authenticate.getToken({_id: req.user._id});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, token: token, status: 'You are successfully logged in!'});
    }
});

router.get('/checkJWTtoken', cors.corsWithOptions, (req, res)=>{
    passport.authenticate('jwt', {session: false}, (err, user,info) =>{
        if(err)
            return next(errr);

        if(!user){
            res.statusCode = 401;
            res.setHeader('Content-Type','application/json');
            return res.json({status:'JWT Invalid', success:true, err:info});
        }else{
            res.statusCode = 200;
            res.setHeader('Content-Type','application/json');
            return res.json({status:'JWT valid', success:true, user:user});
        }
    })(req, res);
});



module.exports = router;
