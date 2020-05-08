const router = require('express').Router();
const validation = require('../lib/validation');
const {getDBReference, getNextSequence} = require("../lib/mongo");

exports.router = router;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userId: { required: true },
  businessId: { required: true },
  caption: { required: false }
};


/*
 * Route to create a new photo.
 */
router.post('/', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, photoSchema)) {
    const [newId, businessId] = await postPhoto(req.body);
    if(newId){
      res.status(201).send({
        id: newId,
        links: {
          photo: `/photos/${newId}`,
          business: `/businesses/${businessId}`
        }
      });
    }
    else{
      res.status(500).send({
        error: "Error posting photo. Please try again."
      });
    }
  } 
  else{
    res.status(400).send({
      error: "Request body is not a valid photo object"
    });
  }
});

async function postPhoto(body){
  let photo = validation.extractValidFields(body, photoSchema);
  const nextVal = await getNextSequence("photoId");
  photo._id = nextVal;

  const db = getDBReference();
  const result = await db.collection("photos").insertOne(photo);
  return [result.insertedId, photo.businessId];
}



/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async (req, res, next) => {
  try{
    const photoId = parseInt(req.params.photoID);
    const photo = await getPhoto(photoId);
    if (photo) {
      res.status(200).send(photo);
    } else {
      next();
    }
  }
  catch(err){
    res.status(500).send({
      error: "Error fetching photo. Please try again."
    });
  }
});

async function getPhoto(id){
  const db = getDBReference();
  const result = await db.collection("photos").findOne({
    _id: id
  });
  return result;
}



/*
 * Route to update a photo.
 */
router.put('/:photoID', async (req, res, next) => {
  if(validation.validateAgainstSchema(req.body, photoSchema)){
    try{
      const photoId = parseInt(req.params.photoID);
      const updatedPhoto = await updatePhoto(req.body, photoId);
      if(updatedPhoto.error == 404){
        next();
      }
      else if(updatedPhoto.error == 403){
        res.status(403).send({
          error: "Updated photo cannot modify businessId or userId"
        });
      }
      else{
        res.status(200).json({
          links: {
            photo: `/photos/${photoId}`,
            business: `/businesses/${req.body.businessId}`
          }
        });
      }
    }
    catch(err){
      res.status(500).send({
        error: "Error updating photo. Please try again."
      });
    }
  }
  else {
    res.status(400).send({
      error: "Request body is not a valid photo object"
    });
  }
});

async function updatePhoto(photo, id){
  const validatedPhoto = validation.extractValidFields(photo, photoSchema);
  const db = getDBReference();
  const curPhoto = await db.collection("photos").findOne({
    _id: id
  });

  if(!curPhoto){
    return {error: 404};
  }
  //If the userId and businessId don't match, can't update
  else if (!(curPhoto.userId == validatedPhoto.userId && curPhoto.businessId == validatedPhoto.businessId)){
    return {error: 403}
  }

  const results = await db.collection("photos").replaceOne(
    {_id: id},
    validatedPhoto
  );
  return results.matchedCount > 0;
}



/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async (req, res, next) => {
  try{
    const photoId = parseInt(req.params.photoID);
    const photo = await deletePhoto(photoId);
    if (photo) {
      res.status(204).end();
    }
    else {
      next();
    }
  }
  catch(err){
    res.status(500).send({
      error: "Error deleting photo. Please try again."
    })
  }
});

async function deletePhoto(id){
  const db = getDBReference();
  const results = await db.collection("photos").deleteOne({
    _id: id
  });
  return results.deletedCount > 0;
}