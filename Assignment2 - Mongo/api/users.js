const router = require('express').Router();
const {getDBReference} = require("../lib/mongo");

exports.router = router;

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userid/businesses', async (req, res) => {
  try{
    const userId = parseInt(req.params.userid);
    const userBusinesses = await getUserBusinesses(userId);
    res.status(200).send({
      businesses: userBusinesses
    });
  }
  catch(err){
    res.status(500).send({
      error: "Error fetching user's business. Please try again."
    })
  }
});

async function getUserBusinesses(id){
  const db = getDBReference();
  const results = await db.collection("businesses").find({
    userId: id
  }).toArray();
  console.log("== Results:", results);
  return results;
}



/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', async (req, res) => {
  try{
    const userId = parseInt(req.params.userid);
    const userReviews = await getUserReviews(userId);
    res.status(200).send({
      reviews: userReviews
    });
  }
  catch(err){
    res.status(500).send({
      error: "Error fetching user's reviews. Please try again."
    })
  }
});

async function getUserReviews(id){
  const db = getDBReference();
  const results = await db.collection("reviews").find({
    ownerId: id
  }).toArray();
  return results;
}



/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', async (req, res) => {
  try{
    const userId = parseInt(req.params.userid);
    const userPhotos = await getUserPhotos(userId);
    res.status(200).send({
      photos: userPhotos
    });
  }
  catch(err){
    res.status(500).send({
      error: "Error fetching user's photos. Please try again."
    });
  }
});

async function getUserPhotos(id){
  const db = getDBReference();
  const results = await db.collection("photos").find({
    userId: id
  }).toArray();
  return results;
}
