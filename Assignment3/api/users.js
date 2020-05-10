const router = require('express').Router();

const { getBusinessesByOwnerId } = require('../models/business');
const { getReviewsByUserId } = require('../models/review');
const { getPhotosByUserId } = require('../models/photo');
const {validateAgainstSchema} = require("../lib/validation");
const {UserSchema, LoginSchema, insertNewUser, loginUser, getUser, requireAuthentication} = require("../models/users");

/*
 * Route to list all of a user's businesses.
 */
router.get('/:id/businesses', requireAuthentication, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const tokenId = parseInt(req.user);
    if(userId !== tokenId && (!req.admin)){
      res.status(403).send({
        error: "Unauthorized access to the specified resource."
      });
    }
    else{
      const businesses = await getBusinessesByOwnerId(parseInt(req.params.id));
      if (businesses) {
        res.status(200).send({ businesses: businesses });
      }
      else {
        next();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch businesses.  Please try again later."
    });
  }
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:id/reviews', requireAuthentication, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const tokenId = parseInt(req.user);
    if(userId !== tokenId && (!req.admin)){
      res.status(403).send({
        error: "Unauthorized access to the specified resource."
      });
    }
    else{
      const reviews = await getReviewsByUserId(parseInt(req.params.id));
      if (reviews) {
        res.status(200).send({ reviews: reviews });
      }
      else {
        next();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch reviews.  Please try again later."
    });
  }
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:id/photos', requireAuthentication, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const tokenId = parseInt(req.user);
    if(userId !== tokenId && (!req.admin)){
      res.status(403).send({
        error: "Unauthorized access to the specified resource."
      });
    }
    else{
      const photos = await getPhotosByUserId(parseInt(req.params.id));
      if (photos) {
        res.status(200).send({ photos: photos });
      }
      else {
        next();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch photos.  Please try again later."
    });
  }
});

// Route to create a new user
router.post("/", async (req, res, next) => {
  if(validateAgainstSchema(req.body, UserSchema)){  
    try{
      const id = await insertNewUser(req.body);
      if(!id){
        res.status(400).send({
          error: "Email already in use."
        })
      }
      else{
        res.status(201).send({
          id: id
        });
      }
    }
    catch(err){
      console.error(err);
      res.status(500).send({
        error: "Unable to add new user. Please try again later."
      });
    }
  }
  else{
    res.status(400).send({
      error: "Request body is not a valid user object."
    });
  }
});

// Route to login a user
router.post("/login", async (req, res, next) => {
  //Send email and password in body, if valid, respond with JWT, JWT payload should contain userID, expire in 24h
  if(validateAgainstSchema(req.body, LoginSchema)){
    try{
      const token = await loginUser(req.body);
      if(!token){  //If no user was found with credentials, return an error
        res.status(401).send({
          error: "Invalid username or password."
        });
      }
      else{ //If user was authenticated and a token was returned
        res.status(200).send({
          token: token
        });
      }
    }
    catch(err){
      console.error(err);
      res.status(500).send({
        error: "Error logging in. Please try again later."
      });
    }
  }
  else{
    res.status(400).send({
      error: "Please enter an email and password."
    });
  }
});

// Route to grab user info
router.get("/:userID", requireAuthentication, async(req, res, next) => {
  try{
    const userId = parseInt(req.params.userID);
    const tokenId = parseInt(req.user);
    if(userId !== tokenId && (!req.admin)){
      res.status(403).send({
        error: "Unauthorized access to the specified resource."
      });
    }
    else{
      const user = await getUser({id: userId}, false);
      if(user){ //If a user was found, send user data
        res.status(200).send({
          user: user
        });
      }
      else{   //Else the user doesn't exist
        next();
      }
    }
  }
  catch(err){
    res.status(500).send({
      error: "Error fetching user data. Please try again later."
    });
  }
});

module.exports = router;
