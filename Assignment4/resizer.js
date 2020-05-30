const sharp = require("sharp");
const {GridFSBucket} = require("mongodb");
const fs = require("fs");

const {connectToDB, getDBReference} = require("./lib/mongo");
const {connectToRabbit, getChannel} = require("./lib/rabbit");
const {getImageDownloadStreamById, updateOriginalPhotoById} = require("./models/photo");

function resizeAndUpload(newPhotoSizes, imageChunks, id, bucket, size){
    console.log("Creating ", size, "p image");
    //Resize the image into a buffer
    const buffer = sharp(imageChunks).resize(size, size).toFormat("jpeg").toBuffer();

    //Open an upload stream to the GridFS bucket
    const uploadStream = bucket.openUploadStream(id.concat('-', size));

    //Create a read stream for the buffer and pipe it to the GridFS upload stream
    fs.createReadStream(buffer).pipe(uploadStream)
        .on("error", (err) => {
            console.error(err);
        })
        .on("finish", (result) => {
            //When the upload is finished, save the id of the resized image to the object
            newPhotoSizes[size] = result._id;
            console.log(size, "p image successfully saved");
        });
}

//Connect to MongoDB
connectToDB(async() => {
    //Get RabbitMQ message channel
    let channel = getChannel();

    //Connect to RabbitMQ
    while(channel == null){
        await connectToRabbit("photos");
        setTimeout(function(){channel = getChannel();}, 1000);
    }
    console.log("Resizer connected to Rabbit");

    //Consume upload message
    channel.consume("photos", msg => {
        console.log(msg);
        console.log("Message grabbed");

        //Grab id of uploaded photo
        const id = msg.content.toString();
        console.log("Image id grabbed: ", id);
        let imageChunks = [];

        //Get the download stream of the image by id
        getImageDownloadStreamById(id)
            .on("file", (file) => {
                console.log("Image retrieved");
            })
            .on("data", chunk => {
                //Push each chunk to the array
                console.log("Downloading image chunks");
                imageChunks.push(chunk);
            })
            .on("end", async() => {
                console.log("Image downloaded");

                let newPhotoSizes = {orig: id};
                //Grab the image's width and height
                const width = sharp(imageChunks).width;
                const height = sharp(imageChunks).height;
                console.log("Image dimensions: ", width, " x ", height);

                //Get the GridFS bucket to interact with the database
                const db = getDBReference();
                const bucket = new GridFSBucket(db, {bucketName: "photos"});

                //Check image's width and height
                if(width >= 1024 && height >= 1024){
                    resizeAndUpload(newPhotoSizes, imageChunks, id, bucket, 1024);
                }
                if(width >= 640 && height >= 640){
                    resizeAndUpload(newPhotoSizes, imageChunks, id, bucket, 640);
                }
                if(width >= 256 && height >= 256){
                    resizeAndUpload(newPhotoSizes, imageChunks, id, bucket, 256);
                }
                if(width >= 128 && height >= 128){
                    resizeAndUpload(newPhotoSizes, imageChunks, id, bucket, 128);
                }
                //Update the original photo, storing the id's of all the resized images
                const result = await updateOriginalPhotoById(id, photoSizes);
            });
        channel.ack(msg);
    });
});