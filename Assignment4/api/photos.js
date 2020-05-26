/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();
const multer = require("multer");
const crypto = require("crypto");

//Store uploaded files in system disk storage in upload directory
const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString("hex");
      const extension = imageTypes[file.mimetype];
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!imageTypes[file.mimetype]);
  }
});

//Supported uploaded image types
const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png"
};

const { validateAgainstSchema } = require('../lib/validation');
const {
  PhotoSchema,
  savePhotoFile,
  removeUploadedPhoto,
  getPhotoById
} = require('../models/photo');

/*
 * Route to create a new photo.
 * upload.single("image") makes middleware expect multipart form-data
 */
router.post('/', upload.single("image"), async (req, res) => {
  if (validateAgainstSchema(req.body, PhotoSchema) && req.file) {
    try {
      const id = await savePhotoFile(req.body, req.file);
      await removeUploadedPhoto(req.file);
      res.status(201).send({
        id: id,
        links: {
          photo: `/photos/${id}`,
          business: `/businesses/${req.body.businessid}`
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error inserting photo into DB.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid photo object"
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id);
    if (photo) {
      const responseBody = {
        _id: photo._id,
        url: `/media/images/${photo.filename}`,
        contentType: photo.metadata.contentType,
        businessid: photo.metadata.businessid,
        caption: photo.metadata.caption
      };
      res.status(200).send(responseBody);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch photo.  Please try again later."
    });
  }
});

module.exports = router;
