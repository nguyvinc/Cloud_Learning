const router = require('express').Router();

const { getBusinessesByOwnerId } = require('../models/business');
const { getReviewsByUserId } = require('../models/review');
const { getPhotosByUserId } = require('../models/photo');
const {validateAgainstSchema} = require("../lib/validation");
const {UserSchema, insertNewUser} = require("../models/users");

/*
 * Route to list all of a user's businesses.
 */
router.get('/:id/businesses', async (req, res, next) => {
  try {
    const businesses = await getBusinessesByOwnerId(parseInt(req.params.id));
    if (businesses) {
      res.status(200).send({ businesses: businesses });
    } else {
      next();
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
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await getReviewsByUserId(parseInt(req.params.id));
    if (reviews) {
      res.status(200).send({ reviews: reviews });
    } else {
      next();
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
router.get('/:id/photos', async (req, res, next) => {
  try {
    const photos = await getPhotosByUserId(parseInt(req.params.id));
    if (photos) {
      res.status(200).send({ photos: photos });
    } else {
      next();
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

module.exports = router;
