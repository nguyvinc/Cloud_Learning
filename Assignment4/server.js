const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const { connectToDB } = require('./lib/mongo');
const {getImageDownloadStreamByFilename} = require("./models/photo");

const app = express();
const port = process.env.PORT || 8000;

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

//Make images in GridFS available for download
app.get("/media/images/:filename", (req, res, next) => {
  getImageDownloadStreamByFilename(req.params.filename)
  .on("file", (file) => {
    res.status(200).type(file.metadata.contentType);
  })
  .on("error", (err) => {
    if(err.code === "ENOENT"){
      next();
    }
    else{
      next(err);
    }
  })
  .pipe(res);
});

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

//Default error handler middleware
app.use("*", function(err, req, res, next){
  console.error(err);
  res.status(500).send({
    error: "An error occurred. Try again later."
  });
});

connectToDB(() => {
  app.listen(port, () => {
    console.log("== Server is running on port", port);
  });
});
