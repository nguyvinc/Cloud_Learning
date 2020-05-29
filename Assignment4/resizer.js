const sharp = require("sharp");
const {GridFSBucket} = require("mongodb");
const fs = require("fs");

const {connectToDB, getDBReference} = require("./lib/mongo");
const {connectToRabbit, getChannel} = require("./lib/rabbit");
const {getImageDownloadStreamById, updateOriginalPhotoById} = require("./models/photo");

//Connect to MongoDB
connectToDB(async () => {
    //Connect to RabbitMQ
    await connectToRabbit("photos");

    //Get RabbitMQ message channel
    const channel = getChannel();

    //Consume upload message
    channel.consume("photos", msg => {
        //Grab id of uploaded photo
        const id = msg.content.toString();
        const imageChunks = [];

        //Get the download stream of the image by id
        getImageDownloadStreamById(id)
            .on("data", chunk => {
                //Push each chunk to the array
                imageChunks.push(chunk);
            })
            .on("end", async() => {
                let newPhotoSizes = {orig: id};
                //Grab the image's width and height
                const width = sharp(imageChunks).width;
                const height = sharp(imageChunks).height;

                //Get the GridFS bucket to interact with the database
                const db = getDBReference();
                const bucket = new GridFSBucket(db, {bucketName: "photos"});

                //Check images width and height
                if(width && height > 1024){
                    //Resize the image into a buffer
                    const buffer = sharp(imageChunks).resize(1024, 1024).toFormat("jpeg").toBuffer();

                    //Open an upload stream to the GridFS bucket
                    const uploadStream = bucket.openUploadStream(id.concat("-1024"));

                    //Create a read stream for the buffer and pipe it to the GridFS upload stream
                    fs.createReadStream(buffer).pipe(uploadStream)
                        .on("error", (err) => {
                            console.error(err);
                        })
                        .on("finish", (result) => {
                            //When the upload is finished, save the id of the resized image to the object
                            newPhotoSizes["1024"] = result._id;
                        });
                }
                if(width && height > 640){
                    const buffer = sharp(imageChunks).resize(640, 640).toFormat("jpeg").toBuffer();
                    const uploadStream = bucket.openUploadStream(id.concat("-640"));
                    fs.createReadStream(buffer).pipe(uploadStream)
                        .on("error", (err) => {
                            console.error(err);
                        })
                        .on("finish", (result) => {
                            newPhotoSizes["640"] = result._id;
                        });
                }
                if(width && height > 256){
                    const buffer = sharp(imageChunks).resize(256, 256).toFormat("jpeg").toBuffer();
                    const uploadStream = bucket.openUploadStream(id.concat("-256"));
                    fs.createReadStream(buffer).pipe(uploadStream)
                        .on("error", (err) => {
                            console.error(err);
                        })
                        .on("finish", (result) => {
                            newPhotoSizes["256"] = result._id;
                        });
                }
                if(width && height > 128){
                    const buffer = sharp(imageChunks).resize(128, 128).toFormat("jpeg").toBuffer();
                    const uploadStream = bucket.openUploadStream(id.concat("-128"));
                    fs.createReadStream(buffer).pipe(uploadStream)
                        .on("error", (err) => {
                            console.error(err);
                        })
                        .on("finish", (result) => {
                            newPhotoSizes["128"] = result._id;
                        });
                }
                //Update the original photo, storing the id's of all the resized images
                const result = await updateOriginalPhotoById(id, photoSizes);
            });
        channel.ack(msg);
    });
});