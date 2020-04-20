const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const port = process.env.PORT || 8000;

const businessList = require("./business-data.json");
const reviewList = require("./reviews.json");
const photoList = require("./photos.json");

app.listen(port, function(){
    console.log("== Server is listening on port ", port);
});

/*
 * Middleware Functions:
 * 
 * Business Owners:
 * X-Add Business
 * X-Modify Business Info
 * X-Remove Business
 * 
 * Users:
 * X-Get Business List
 * X-Get Single Business Info
 * X-Submit Business Review
 * X-Modify Business Review
 * X-Delete Business Review
 * X-Upload Business Image
 * X-Delete Business Photo
 * X-Modify Business Photo Caption
 * X-List Owned Businesses
 * X-List All Written Reviews
 * X-List All Uploaded Photos
 * 
*/

function pagination(page, pageSize, list){
    let returnArr = [0, 1, 0, 0, 0]; //totalPage, page, error, nextPage, prevPage
    returnArr[0] = Math.floor(list.length / pageSize) + 1;  //Calculate total pages
    if(list.length % pageSize === 0){ //If number of elements divisible by page size, total pages reduced by 1
        returnArr[0] -= 1;
    }
    if(page){   //If a page is specfied
        returnArr[1] = page;    //Set the page to grab
        if(returnArr[1] > returnArr[0] || returnArr[1] < 0){    //If the page doesn't exist
            returnArr[2] = 1;   //Set error flag
        }
    }
    returnArr[3] = returnArr[1] + 1;    //Get the next page
    returnArr[4] = returnArr[1] - 1;    //Get the previous page
    if(returnArr[3] > returnArr[0]){  //If the next page is greater than the total pages, grab page 1
        returnArr[3] = 1;
    }
    if(returnArr[4] === 0){         //If the previous page is 0, grab the last page
        returnArr[4] = returnArr[0];
    }
    return returnArr;
}

//
//// Businesses
//

// Get Business List
app.get("/businesses", function(req, res, next){
    console.log("== List Business Request", req.query);
    const pageSize = 10;
    //totalPage, page, error, nextPage, prevPage
    const result = pagination(req.query.page, pageSize, businessList);

    if(result[2] == 0){
        let businessLinks = [];
        for(let i=((result[1]-1)*pageSize); i<result[1]*pageSize; i++){ //HATEOAS for business list
            if(i < businessList.length){
                businessLinks.push("/businesses/"+businessList[i].businessId);
            }
            else{
                break;
            }
        }

        res.status(200).send({      //Send the data
            "pageNumber": parseInt(result[1]),
            "totalPages": parseInt(result[0]),
            "pageSize": pageSize,
            "totalCount": businessList.length,
            "businesses": businessList,
            "businessLinks": businessLinks,
            "pageLinks": {
                "nextPage": "/businesses?page="+result[3],
                "prevPage": "/businesses?page="+result[4]
            }
        });
    }
    else{
        next();
    }
});

// Add Business
app.post("/businesses", function(req, res, next){
    console.log("== Add Business Request", req.body);
    //Check for required fields
    if(req.body.name && req.body.address && req.body.city && req.body.state && req.body.zip && req.body.phone && req.body.category && req.body.subcategories && req.body.ownerId){
        let newBusiness = req.body;    //Grab the business info
        newBusiness.businessId = 1;            //Generate new business id
        businessList.forEach(function(business){    //Search through all businesses
            if(business.businessId >= newBusiness.businessId){     //Find highest current business id
                newBusiness.businessId = business.businessId + 1;  //Add 1 to current highest business id
            }
        });
        businessList.push(newBusiness);//Add business to the list
        res.status(201).send({
            "msg": "Business successfully added.",
            "newBusiness": newBusiness
        });
    }
    else{   //If any required fields are empty, send error
        res.status(400).send({
            err: "Request doesn't have the required fields."
        });
    }
});

// Get Single Business
app.get("/businesses/:bId", function(req, res, next){
    console.log("== Single Business Request", req.params);
    const reqId = req.params.bId;  //Get requested id
    let found = false;
    businessList.forEach((business) => {//Search through all businesses
        if(business.businessId == reqId){   //If business id matches requested id
            found = true;
            const reviews = reviewList.filter((review) => {
                return review.businessId == business.businessId;
            });
            const photos = photoList.filter((photo) => {
                return photo.businessId == business.businessId;
            });
            const reviewerList = reviews.map(review => "/reviews/user/"+review.userId);
            let usedIds = [];
            let uploaderList = [];
            photoList.forEach((photo) => {
                if(usedIds.indexOf(photo.userId) === -1){
                    usedIds.push(photo.userId);
                    uploaderList.push("/photos/"+photo.userId);
                }
            });
            res.status(200).send({
                "businessData": business,
                "reviews": reviews,
                "reviewers": reviewerList,
                "photos": photos,
                "photoUploaders": uploaderList
            }); //Send business's data
        }
    });
    if(!found){ //If requested id was not found, go to 404
        next();
    }
});

// Modify Business
app.put("/businesses/:bId", function(req, res, next){
    console.log("== Modify Business Request", req.body);
    //Check for required fields
    if(req.body && req.body.name && req.body.address && req.body.city && req.body.state && req.body.zip && req.body.phone && req.body.category && req.body.subcategories){
        const reqId = req.params.bId;    //Get requested id
        let found = false;
        for(let i=0; i<businessList.length; i++){       //Search through all businesses
            if(businessList[i].businessId == reqId){   //If business id matches requested id
                req.body.ownerId = businessList[i].ownerId;
                req.body.businessId = businessList[i].businessId;
                businessList[i] = req.body; //Modify the business
                found = true;
                res.status(200).send({
                    "msg": "Business modified.",
                    "input": req.body
                });
                break;
            }
        }
        if(!found){ //If requested id was not found, go to 404
            next();
        }
    }
    else{   //If any required fields are empty, send error
        res.status(400).send({
            err: "Request doesn't have required fields."
        });
    }
});

// Delete Business
app.delete("/businesses/:bId", function(req, res, next){
    console.log("== Delete Business Request");
    const reqId = req.params.bId;    //Get requested id
    let found = false;
    for(let i=0; i<businessList.length; i++){   //Search through all businesses
        if(businessList[i].businessId == reqId){    //If business id matches requested id
            found = true;
            businessList.splice(i, 1);  // Remove the business
            res.status(200).send({
                "msg": "Business deleted.",
                "id": reqId
            });
            break;
        }
    }
    if(!found){ //If requested id was not found, go to 404
        next();
    }
});

// List Owned Businesses
app.get("/businesses/owner/:uId", function(req, res, next){
    console.log("== List Owned Businesses Request UserID:", req.params.uId);
    const userId = req.params.uId;  //Get requested userId
    //Grab all businesses with owner id = requested id
    const ownedBusinesses = businessList.filter(business => business.ownerId == userId);
    const pageSize = 10;
    const result = pagination(req.query.page, pageSize, ownedBusinesses);
    if(result[2] == 0){
        let businessLinks = [];
        ownedBusinesses.forEach((business) => { //HATEOAS for all owned businesses
            businessLinks.push("/businesses/"+business.businessId);
        });
        res.status(200).send({
            "pageNumber": parseInt(result[1]),
            "totalPages": parseInt(result[0]),
            "pageSize": pageSize,
            "totalCount": ownedBusinesses.length,
            "businesses": ownedBusinesses,
            "businessLinks": businessLinks,
            "pageLinks": {
                "nextPage": "/businesses/owner/"+req.params.uId+"?page="+result[3],
                "prevPage": "/businesses/owner/"+req.params.uId+"?page="+result[4]
            }
        });
    }
    else{
        next();
    }
});


//
//// Business Reviews
//

// List All Written Reviews
app.get("/reviews/user/:uId", function(req, res, next){
    console.log("== List All Written Reviews UserID:", req.params.uId);
    const userId = req.params.uId;  //Get requested userId
    const reviews = reviewList.filter(business => business.userId == userId);  //Grab all reviews with user id = requested user id
    const pageSize = 10;
    //totalPage, page, error, nextPage, prevPage
    const result = pagination(req.query.page, pageSize, reviews);
    if(result[2] == 0){
        const reviewLinks = reviews.map(review => "/businesses/"+review.businessId);

        res.status(200).send({
            "pageNumber": parseInt(result[1]),
            "totalPages": parseInt(result[0]),
            "pageSize": pageSize,
            "totalCount": reviews.length,
            "reviews": reviews,
            "reviewedBusinesses": reviewLinks,
            "pageLinks": {
                "nextPage": "/reviews/user/"+req.params.uId+"?page="+result[3],
                "prevPage": "/reviews/user/"+req.params.uId+"?page="+result[4]
            }
        });  //Send written review list
    }
    else{
        next();
    }
});

// Submit Business Review
app.post("/reviews", function(req, res, next){
    console.log("== Submit Business Review Request", req.body);
    if(req.body && req.body.star && req.body.dollarSign && req.body.description && req.body.businessId && req.body.userId){
        let newReview = req.body;
        if(businessList.find((business) => {
            return business.businessId == newReview.businessId;
        })){
            //Check if user has already reviewed selected business
            if(reviewList.find((review) => {
                return ((review.businessId == newReview.businessId && review.userId == newReview.userId));
            })){
                //If a review was found
                res.status(400).send({
                    "err": "User has already reviewed selected business."
                });
            }
            else{   //If a review was not found
                newReview.reviewId = 1;
                reviewList.forEach((review) => {
                    if(review.reviewId >= newReview.reviewId){
                        newReview.reviewId = review.reviewId + 1;
                    }
                });
                reviewList.push(newReview);
                res.status(201).send({
                    "msg": "Review successfully added.",
                    "newReview": newReview
                });
            }
        }
        else{
            res.status(404).send({
                "err": "Reviewed business not found."
            });
        }
    }
    else{
        res.status(400).send({
            err: "Request doesn't have required fields."
        });
    }
});

// Modify Business Review
app.put("/reviews/:rId", function(req, res, next){
    console.log("== Modify Business Review Request", req.body);
    //Check for required fields
    if(req.body && req.body.star && req.body.dollarSign && req.body.description){
        const reqId = req.params.rId;    //Get requested id
        let found = false;
        for(let i=0; i<reviewList.length; i++){     //Search through all reviews
            if(reviewList[i].reviewId == reqId){   //If review id matches requested id
                reviewList[i].star = req.body.star; //Modify the review
                reviewList[i].dollarSign = req.body.dollarSign;
                reviewList[i].description = req.body.description;
                found = true;
                res.status(200).send({
                    msg: "Review modified.",
                    input: req.body
                });
                break;
            }
        }
        if(!found){ //If requested id was not found, go to 404
            next();
        }
    }
    else{   //If any required fields are empty, send error
        res.status(400).send({
            err: "Request doesn't have required fields."
        });
    }
});

// Delete Business Review
app.delete("/reviews/:rId", function(req, res, next){
    console.log("== Delete Business Review Request");
    const reqId = req.params.rId;    //Get requested id
    let found = false;
    for(let i=0; i<reviewList.length; i++){     //Search through all reviews
        if(reviewList[i].reviewId == reqId){   //If review id matches requested id
            found = true;
            reviewList.splice(i, 1);  // Remove the business
            res.status(200).send({
                msg: "Review deleted.",
                id: reqId
            });
            break;
        }
    }
    if(!found){ //If requested id was not found, go to 404
        next();
    }
});

//
//// Business Photos
//

// List All Uploaded Photos
app.get("/photos/:uId", function(req, res, next){
    console.log("== List All Uploaded Photos UserID:", req.params.uId);
    const userId = req.params.uId;  //Get requested userId
    const photos = photoList.filter(photo => photo.userId == userId);  //Grab all reviews with user id = requested user id

    const pageSize = 10;
    const result = pagination(req.query.page, pageSize, photos);
    if(result[2] == 0){
        let businessLinks = [];
        let usedIds = [];
        photos.forEach((photo) => { //HATEOAS for all uploaded photos for businesses
            if(usedIds.indexOf(photo.businessId) === -1){
                usedIds.push(photo.businessId);
                businessLinks.push("/businesses/"+photo.businessId);
            }
        });
        res.status(200).send({
            "pageNumber": parseInt(result[1]),
            "totalPages": parseInt(result[0]),
            "pageSize": pageSize,
            "totalCount": photos.length,
            "photos": photos,
            "businessLinks": businessLinks,
            "pageLinks": {
                "nextPage": "/photos/"+req.params.uId+"?page="+result[3],
                "prevPage": "/photos/"+req.params.uId+"?page="+result[4]
            }
        });
    }
    else{
        next();
    }
});

// Add Business Image
app.post("/photos", function(req, res, next){
    console.log("== Add Photo Request", req.body);
    if(req.body && req.body.url && req.body.caption && req.body.businessId && req.body.userId){
        let newPhoto = req.body;    //Grab the photo info
        newPhoto.photoId = 1;            //Generate new photo id
        photoList.forEach(function(photo){    //Search through all photos
            if(photo.photoId >= newPhoto.photoId){     //Find highest current photo id
                newPhoto.photoId = photo.photoId + 1;  //Add 1 to current highest photo id
            }
        });
        photoList.push(newPhoto);//Add business to the list
        res.status(201).send({
            "msg": "Photo successfully added.",
            "newPhoto": newPhoto
        });
    }
    else{
        res.status(400).send({
            err: "Request doesn't have the required fields."
        });
    }
});

// Modify Business Image Caption
app.put("/photos/:pId", function(req, res, next){
    console.log("== Modify Photo Caption Request", req.body);
    if(req.body && req.body.caption){
        const pId = req.params.pId;
        let found = false;
        for(let i=0; i<photoList.length; i++){
            if(photoList[i].photoId == pId){
                found = true;
                photoList[i].caption = req.body.caption;
                res.status(200).send({
                    "msg": "Photo caption modified.",
                    "captionInput": photoList[i].caption
                });
            };
        }
        if(!found){
            next();
        }
    }
    else{
        res.status(400).send({
            err: "Request doesn't have the required fields."
        });
    }
});

// Delete Business Photo
app.delete("/photos/:pId", function(req, res, next){
    console.log("== Delete Photo Request");
    const reqId = req.params.pId;    //Get requested id
    let found = false;
    for(let i=0; i<photoList.length; i++){  //Search through all photos
        if(photoList[i].photoId == reqId){ //If photo id matches requested id
            found = true;
            photoList.splice(i, 1);  // Remove the photo
            res.status(200).send({
                msg: "Photo deleted.",
                id: reqId
            });
            break;
        }
    }
    if(!found){ //If requested id was not found, go to 404
        next();
    }
});

app.use("*", function(req, res, next){
    res.status(404).send({err: "The requested resource was not found."});
});