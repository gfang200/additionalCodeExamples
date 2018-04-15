'use strict';

var User = require('../models/user');
var Email = require('../models/email');
var nodemailer = require('nodemailer');
var mailgunApiTransport = require('nodemailer-mailgunapi-transport');
var secrets = require('../config/secrets');
var fs = require('fs');

//plans = User.getPlans();

exports.getHome = function(req, res, next){
  var form = {},
  error = null,
  formFlash = req.flash('form'),
  errorFlash = req.flash('error');

  if (formFlash.length) {
    form.email = formFlash[0].email;
  }
  if (errorFlash.length) {
    error = errorFlash[0];
  }
  res.render(req.render, {form: form, error: error});
};

exports.getStartup = function(req, res, next){
  var form = {},
  error = null,
  formFlash = req.flash('form'),
  errorFlash = req.flash('error');

  if (formFlash.length) {
    form.email = formFlash[0].email;
  }
  if (errorFlash.length) {
    error = errorFlash[0];
  }
  res.render(req.render, {form: form, error: error});
};

exports.postStartup = function(req, res, next){
  var form = {},
  error = null,
  formFlash = req.flash('form'),
  errorFlash = req.flash('error');
  
  if (req.body.invite == "tryfreemotoday"){

    res.redirect(req.redirect.success)
  
  } else {

    res.render(req.render, {error: "Invalid Code"});
  }
};


exports.getLogin = function(req, res, next){
  var form = {},
  error = null,
  formFlash = req.flash('form'),
  errorFlash = req.flash('error');

  if (formFlash.length) {
    form.email = formFlash[0].email;
  }
  if (errorFlash.length) {
    error = errorFlash[0];
  }
  res.render(req.render, {form: form, error: error});
};

exports.getGeneric = function(req, res, next){
  var form = {},
  error = null,
  formFlash = req.flash('form'),
  errorFlash = req.flash('error');

  if (formFlash.length) {
    form.email = formFlash[0].email;
  }
  if (errorFlash.length) {
    error = errorFlash[0];
  }
  res.render(req.render, {user: req.user, form: form, error: error});
};

exports.postMailingList = function(req, res,next){

  var submitted = {};


  var userEmail = req.body.email
  if (req.body.optin == "on") 
  {var userOptin = true} 
  else 
  {var userOptin = false}

  console.log(userEmail)
  console.log(userOptin)


  Email.findOne({ 'email' :  userEmail },
  function(err, user) {
    if (err) return done(err);
    if (!user){
      var newEmail = new Email({
        email:userEmail,
        optin:userOptin
      });
    
    
      newEmail.save(function(err) {  
        res.render(req.render, {submitted: 'pass'});
      var transporter = nodemailer.createTransport(mailgunApiTransport(secrets.mailgun));
      

      var emailBody = fs.readFileSync('server/emails/mailinglist.html').toString();

      var mailOptions = {
        to: userEmail,
        from: 'noreply@tryfreemo.com',
        subject: 'Thanks for joining our mailing list!',
        html: emailBody
      };
    
      transporter.sendMail(mailOptions, function(err) {
        var time = 14 * 24 * 3600000;
        req.session.cookie.maxAge = time; //2 weeks
        req.session.cookie.expires = new Date(Date.now() + time);
        req.session.touch();
      });
    
      
      });
    } else {
      res.render(req.render, {submitted: 'fail'});
    }
  })









}