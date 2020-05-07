const router = require('express').Router();
const validation = require('../lib/validation');
const {getDBReference} = require("../lib/mongo");
const ObjectID = require("mongodb").ObjectID;

exports.router = router;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userId: { required: true },
  businessId: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};


/*
 * Route to create a new review.
 */
router.post('/', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, reviewSchema)) {
    const review = await postReview(req.body);
    if (review.error == 403) {
      res.status(403).send({
        error: "User has already posted a review of this business"
      });
    }
    else if (review){
      res.status(201).json({
        id: review,
        links: {
          review: `/reviews/${review}`,
          business: `/businesses/${req.body.businessId}`
        }
      });
    }
    else{
      res.status(500).send({
        error: "Error posting review. Please try again."
      });
    }
  }
  else {
    res.status(400).send({
      error: "Request body is not a valid review object"
    });
  }
});

async function postReview(body){
  const validatedReview = validation.extractValidFields(body, reviewSchema);
  //Make sure the user is not trying to review the same business twice.
  const db = getDBReference();
  const existingReview = await db.collection("reviews").findOne({
    userId: validatedReview.userId,
    businessId: validatedReview.businessId
  });
  if(existingReview){
    return {error: 403};
  }
  
  const result = await db.collection("reviews").insertOne(validatedReview);
  return result.insertedId;
}



/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async (req, res, next) => {
  try{
    const reviewId = parseInt(req.params.reviewID);
    const review = await getReview(reviewId);
    if(review) {
      res.status(200).send(review);
    } 
    else {
      next();
    }
  }
  catch(err){
    res.status(500).send({
      error: "Error fetching review. Please try again."
    })
  }
});

async function getReview(id){
  const db = getDBReference();
  const results = await db.collection("reviews").findOne({
    _id: new ObjectID(id)
  });
  return results;
}



/*
 * Route to update a review.
 */
router.put('/:reviewID', async (req, res, next) => {
  const reviewId = parseInt(req.params.reviewID);
  if (validation.validateAgainstSchema(req.body, reviewSchema)) {
    try{
      const updatedReview = await updateReview(req.body, reviewId);
      if(updatedReview.error == 404){
        next();
      }
      else if(updatedReview.error == 403){
        res.status(403).send({
          error: "Updated review cannot modify businessId or userId"
        });
      } 
      else {
        res.status(200).send({
          links: {
            review: `/reviews/${reviewId}`,
            business: `/businesses/${req.body.businessId}`
          }
        });
      }
    }
    catch(err){
      res.status(500).send({
        error: "Error updating review. Please try again."
      });
    }
  }
  else {
    res.status(400).json({
      error: "Request body is not a valid review object"
    });
  }
});

async function updateReview(body, id){
  let validatedReview = validation.extractValidFields(body, reviewSchema);
  const db = getDBReference();
  const curReview = await db.collection("reviews").findOne({
    _id: new ObjectID(id)
  });
  if(!curReview){
    return {error: 404};
  }
  else if(!(curReview.userId == validatedReview.userId && curReview.businessId == validatedReview.businessId)){
    return {error: 403};
  }

  const results = await db.collection("reviews").replaceOne(
    {_id: new ObjectID(id)},
    validatedReview
  );
  return results.matchedCount > 0;
}



/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async (req, res, next) => {
  const reviewId = parseInt(req.params.reviewID);
  const review = await deleteReview(reviewId);
  if (review) {
    res.status(204).end();
  } 
  else {
    next();
  }
});

async function deleteReview(id){
  const db = getDBReference();
  const results = await db.collection("reviews").deleteOne({
    _id: new ObjectID(id)
  });
  return results.affectedRows > 0;
}