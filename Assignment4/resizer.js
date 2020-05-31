const sizeOf = require("image-size");
const jimp = require("jimp");
const stream = require("stream");
const {GridFSBucket} = require("mongodb");

const {connectToDB, getDBReference} = require("./lib/mongo");
const {connectToRabbit, getChannel} = require("./lib/rabbit");
const {getImageDownloadStreamById, updateOriginalPhotoById} = require("./models/photo");

async function resizeAndUpload(image, id, bucket, size){
    return new Promise(async(resolve) => {
        //Resize the image into a buffer
        const photo = await jimp.read(image);
        await photo.resize(size, size);
        const buffer = await photo.getBufferAsync("image/jpeg");

        //Open an upload stream to the GridFS bucket
        const uploadStream = bucket.openUploadStream(id.concat('-', size));

        //From StackOverflow https://stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream
        //Initiate the source
        const bufferStream = new stream.PassThrough();
        //Write buffer into stream
        bufferStream.end(buffer);
        //Pipe the stream to the GridFS upload stream
        bufferStream.pipe(uploadStream)
            .on("error", (err) => {
                console.error(err);
            })
            .on("finish", (result) => {
                //When the upload is finished, save the id of the resized image to the object
                resolve(result._id);
            });
    });
}

//Connect to MongoDB
connectToDB(async() => {
    //Connect to RabbitMQ
    await connectToRabbit("photos");

    //Get RabbitMQ message channel
    const channel = getChannel();

    //Consume upload message
    channel.consume("photos", msg => {
        console.log("Processing uploaded image");
        //Grab id of uploaded photo
        const id = msg.content.toString();
        const imageChunks = [];

        //Get the download stream of the image by id
        getImageDownloadStreamById(id)
            .on("data", (chunk) => {
                //Push each chunk to the array
                imageChunks.push(chunk);
            })
            .on("end", async() => {
                const image = Buffer.concat(imageChunks);

                let newPhotoSizes = {orig: id};
                //Grab the image's width and height
                const dimensions = sizeOf(image);

                //Get the GridFS bucket to interact with the database
                const db = getDBReference();
                const bucket = new GridFSBucket(db, {bucketName: "photos"});

                //Check image's width and height
                if(dimensions.width >= 1024 && dimensions.height >= 1024){
                    newPhotoSizes["1024"] = await resizeAndUpload(image, id, bucket, 1024);
                }
                if(dimensions.width >= 640 && dimensions.height >= 640){
                    newPhotoSizes["640"] = await resizeAndUpload(image, id, bucket, 640);
                }
                if(dimensions.width >= 256 && dimensions.height >= 256){
                    newPhotoSizes["256"] = await resizeAndUpload(image, id, bucket, 256);
                }
                if(dimensions.width >= 128 && dimensions.height >= 128){
                    newPhotoSizes["128"] = await resizeAndUpload(image, id, bucket, 128);
                }
                //Update the original photo, storing the id's of all the resized images
                await updateOriginalPhotoById(id, newPhotoSizes);
                console.log("Processing complete");
            });
        channel.ack(msg);
    });
});