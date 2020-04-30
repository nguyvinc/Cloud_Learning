const router = require('express').Router();
const validation = require('../lib/validation');
const mysqlPool = require("../lib/mysqlPool");

const photos = require('../data/photos');

exports.router = router;
exports.photos = photos;

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
  const photo = validation.extractValidFields(body, photoSchema);
  const [result] = await mysqlPool.query(
    "INSERT INTO `Photos` SET ?;",
    photo
  );
  return [result.insertId, photo.businessId];
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
  const [results] = await mysqlPool.query(
    "SELECT * FROM `Photos` WHERE `id`=?",
    id
  );
  return results[0];
}



/*
 * Route to update a photo.
 */
router.put('/:photoID', async (req, res, next) => {
  try{
    const photoId = parseInt(req.params.photoID);
    if (validation.validateAgainstSchema(req.body, photoSchema)){
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
    else {
      res.status(400).send({
        error: "Request body is not a valid photo object"
      });
    }
    //404
  }
  catch(err){
    res.status(500).send({
      error: "Error updating photo. Please try again."
    });
  }
});

async function updatePhoto(photo, id){
  const validatedPhoto = validation.extractValidFields(photo, photoSchema);
  const [curPhoto] = await mysqlPool.query(
    "SELECT * FROM `Photos` WHERE `id` = ?;", 
    id
  );

  if(!curPhoto[0]){
    return {error:404};
  }
  //If the userId and businessId don't match, can't update
  else if (!(curPhoto[0].userId == validatedPhoto.userId && curPhoto[0].businessId == validatedPhoto.businessId)){
    return {error:403}
  }

  const [results] = await mysqlPool.query(
    "UPDATE `Photos` SET ? WHERE `id`=?;",
    [validatedPhoto, id]
  );
  return results.affectedRows > 0;
}



/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async (req, res, next) => {
  try{
    const photoId = parseInt(req.params.photoID);
    const photo = await deletePhoto(photoId)
    if (photo) {
      res.status(204).end();
    }
    else {
      next();
    }
  }
  catch(err){
    res.status(500).send({
      error: "Error deleteing photo. Please try again."
    })
  }
});

async function deletePhoto(id){
  const [results] = await mysqlPool.query(
    "DELETE FROM `Photos` WHERE `id` = ?",
    id
  );
  return results.affectedRows > 0;
}