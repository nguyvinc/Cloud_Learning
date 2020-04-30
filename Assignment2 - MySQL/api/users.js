const router = require('express').Router();
const mysqlPool = require("../lib/mysqlPool");

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
  const [results] = await mysqlPool.query(
    "SELECT * FROM `Businesses` WHERE `userId`=?;",
    id
  );
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
  const [results] = await mysqlPool.query(
    "SELECT * FROM `Reviews` WHERE `userId`=?;",
    id
  );
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
  const [results] = await mysqlPool.query(
    "SELECT * FROM `Photos` WHERE `userId`=?;",
    id
  );
  return results;
}
