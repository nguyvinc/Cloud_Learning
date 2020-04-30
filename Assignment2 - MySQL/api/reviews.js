const router = require('express').Router();
const validation = require('../lib/validation');
const mysqlPool = require("../lib/mysqlPool");

const reviews = require('../data/reviews');

exports.router = router;
exports.reviews = reviews;

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
  const [existingReview] = await mysqlPool.query(
    "SELECT * FROM `Reviews` WHERE `userId`=? AND `businessId`=?;",
    [validatedReview.userId, validatedReview.businessId]
  );
  if(existingReview[0]){
    return {error: 403};
  }
  
  const [result] = await mysqlPool.query(
    "INSERT INTO `Reviews` SET ?;",
    validatedReview
  );
  return result.insertId;
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
  const [results] = await mysqlPool.query(
    "SELECT * FROM `Reviews` WHERE `id`=?;",
    id
  );
  return results[0];
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
  const [curReview] = await mysqlPool.query(
    "SELECT * FROM `Reviews` WHERE `id`=?;",
    id
  );
  if(!curReview[0]){
    return {error: 404};
  }
  else if(!(curReview[0].userId == validatedReview.userId && curReview[0].businessId == validatedReview.businessId)){
    return {error: 403};
  }

  const [results] = await mysqlPool.query(
    "UPDATE `Reviews` SET ? WHERE `id`=?;",
    [validatedReview, id]
  );
  return results.affectedRows > 0;
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
  const [results] = await mysqlPool.query(
    "DELETE FROM `Reviews` WHERE `id` = ?;",
    id
  );
  return results.affectedRows > 0;
}