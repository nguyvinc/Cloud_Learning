const sharp = require("sharp");
const {GridFSBucket} = require("mongodb");
const fs = require("fs");

const {connectToDB, getDBReference} = require("./lib/mongo");
const {connectToRabbit, getChannel} = require("./lib/rabbit");
const {getImageDownloadStreamById, updateOriginalPhotoById} = require("./models/photo");

function resizeAndUpload(newPhotoSizes, image, id, bucket, size){
    console.log("Creating ", size, "p image");
    //Resize the image into a buffer
    const buffer = sharp(image).resize(size, size).toFormat("jpeg").toBuffer();

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
    //Connect to RabbitMQ
    await connectToRabbit("photos");
    console.log("Resizer connected to Rabbit");

    //Get RabbitMQ message channel
    const channel = getChannel();

    //Consume upload message
    channel.consume("photos", msg => {
        //Grab id of uploaded photo
        const id = msg.content.toString();
        console.log("Image id grabbed: ", id);
        const imageChunks = [];

        //Get the download stream of the image by id
        getImageDownloadStreamById(id)
            .on("data", (chunk) => {
                //Push each chunk to the array
                imageChunks.push(chunk);
            })
            .on("end", async() => {
                console.log("Image downloaded");
                const image = Buffer.concat(imageChunks);

                let newPhotoSizes = {orig: id};
                //Grab the image's width and height
                const width = sharp(image).width;
                const height = sharp(image).height;
                console.log("Image dimensions: ", width, " x ", height);

                //Get the GridFS bucket to interact with the database
                const db = getDBReference();
                const bucket = new GridFSBucket(db, {bucketName: "photos"});

                //Check image's width and height
                if(width >= 1024 && height >= 1024){
                    resizeAndUpload(newPhotoSizes, image, id, bucket, 1024);
                }
                if(width >= 640 && height >= 640){
                    resizeAndUpload(newPhotoSizes, image, id, bucket, 640);
                }
                if(width >= 256 && height >= 256){
                    resizeAndUpload(newPhotoSizes, image, id, bucket, 256);
                }
                if(width >= 128 && height >= 128){
                    resizeAndUpload(newPhotoSizes, image, id, bucket, 128);
                }
                //Update the original photo, storing the id's of all the resized images
                const result = await updateOriginalPhotoById(id, photoSizes);
            })
            .on("error", (err) =>{
                console.log(err);
            });
        channel.ack(msg);
    });
});