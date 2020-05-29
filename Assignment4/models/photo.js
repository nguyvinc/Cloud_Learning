/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require('mongodb');
const fs = require("fs");

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessid: { required: true },
  caption: { required: false }
};
exports.PhotoSchema = PhotoSchema;

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo, file) {
  photo = extractValidFields(photo, PhotoSchema);
  photo.businessid = ObjectId(photo.businessid);

  photo.contentType = file.mimetype;
  photo.filename = file.filename;
  photo.path = file.path;

  const db = getDBReference();
  const collection = db.collection('photos');
  const result = await collection.insertOne(photo);
  return result.insertedId;
}
exports.insertNewPhoto = insertNewPhoto;


function savePhotoFile(photo, file){
  return new Promise((resolve, reject) => {
    const db = getDBReference();

    //Create a bucket to interact with GridFS
    const bucket = new GridFSBucket(db, {bucketName: "photos"});

    //Grab all the file metadata to store in GridFS
    const metadata = {
      contentType: file.mimetype,
      businessid: photo.businessid,
      caption: photo.caption
    };

    //Create upload stream to upload photo to GridFS
    const uploadStream = bucket.openUploadStream(
      file.filename,
      {metadata: metadata}
    );
    //Use FS to read the photo and pipe it to the upload stream
    fs.createReadStream(file.path).pipe(uploadStream)
      .on("error", (err) => {
        reject(err);
      })
      .on("finish", (result) => {
        resolve(result._id);  //Return object id when finished
      });
  });
}
exports.savePhotoFile = savePhotoFile;


function removeUploadedPhoto(photo){
  return new Promise((resolve, reject) => {
    //Delete the recently uploaded photo (after it has been uploaded to GridFS)
    fs.unlink(photo.path, (err) => {
      if (err){
        reject(err);
      }
      else{
        resolve();
      }
    });
  });
}
exports.removeUploadedPhoto = removeUploadedPhoto;


function getImageDownloadStreamByFilename(filename){
  const db = getDBReference();
  //Create a bucket to interact with GridFS
  const bucket = new GridFSBucket(db, {bucketName: "photos"});
  //Open a download stream using the filename
  return bucket.openDownloadStreamByName(filename);
}
exports.getImageDownloadStreamByFilename = getImageDownloadStreamByFilename;


function getImageDownloadStreamById(id){
  const db = getDBReference();
  //Create a bucket to interact with GridFS
  const bucket = new GridFSBucket(db, {bucketName: "photos"});
  //Check if the passed in id is a valid ObjectId
  if(!ObjectId.isValid(id)){
    return null;
  }
  else{
    //Open a download stream using the photo's id
    return bucket.openUploadStream(id);
  }
}
exports.getImageDownloadStreamById = getImageDownloadStreamById;


async function updateOriginalPhotoById(id, sizes){
  const db = getDBReference();
  const collection = db.collection("photos.files");
  if(!ObjectId.isValid(id)){
    return null;
  }
  else{
    const result = await collection.updateOne(
      {_id: id},
      {$set: {"metadata.photoSizez": sizes}}
    );
    return result.matchedCount > 0;
  }
}
exports.updateOriginalPhotoById = updateOriginalPhotoById;


/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
  const db = getDBReference();
  //const collection = db.collection('photos');

  //Create GridFS Bucket to grab photo
  const bucket = new GridFSBucket(db, {bucketName: "photos"});
  if (!ObjectId.isValid(id)) {
    return null;
  } 
  else {  
    /*const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();*/
    const results = await bucket.find({_id: ObjectId(id)}).toArray();
    return results[0];
  }
}
exports.getPhotoById = getPhotoById;

/*
 * Executes a DB query to fetch all photos for a specified business, based
 * on the business's ID.  Returns a Promise that resolves to an array
 * containing the requested photos.  This array could be empty if the
 * specified business does not have any photos.  This function does not verify
 * that the specified business ID corresponds to a valid business.
 */
async function getPhotosByBusinessId(id) {
  const db = getDBReference();
  //const collection = db.collection('photos');

  //Create GridFS Bucket to grab photos
  const bucket = new GridFSBucket(db, {bucketName: "photos"}); 
  if (!ObjectId.isValid(id)) {
    console.log("ID not valid: ", id);
    return [];
  } else {
    /*const results = await collection
      .find({ businessid: id })
      .toArray();*/
    const results = await bucket.find({"metadata.businessid": id}).toArray();
    console.log(results);
    return results;
  }
}
exports.getPhotosByBusinessId = getPhotosByBusinessId;
