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
 *  Middleware Functions
*/


/* 
 * Middleware Functions Needed:
 * 
 * Business Owners:
 * X-Add Business
 * X-Modify Business Info
 * X-Remove Business
 * 
 * Users:
 * X-Get Business List
 * ?-Get Single Business Info
 * X-Submit Business Review
 * X-Modify Business Review
 * X-Delete Business Review
 * -Upload Business Image
 * -Delete Business Photo
 * -Modify Business Photo Caption
 * X-List Owned Businesses
 * X-List All Written Reviews
 * -List All Uploaded Photos
 * 
*/

//
//// Businesses
//

// Get Business List
app.get("/businesses", function(req, res, next){
    console.log("== List Business Request", req.query);
    let page = 1;
    let totalPage = Math.floor(businessList.length / 10) + 1;  //Calculate total pages
    if(businessList.length % 10 === 0){ //If number of businesses divisible by 10, total pages reduced by 1
        totalPage -= 1;
    }
    if(req.query.page){         //If a page is specfied
        page = req.query.page;  //Set the page to grab
        if(page > totalPage || page < 0){  //If the page doesn't exist
            next();             //Go to 404 not found
        }
    }
    let nextPage = page + 1;    //Get the next page
    let prevPage = page - 1;    //Get the previous page
    if(nextPage > totalPage){  //If the next page is greater than the total pages, grab page 1
        nextPage = 1;
    }
    if(prevPage === 0){         //If the previous page is 0, grab the last page
        prevPage = totalPage;
    }

    res.status(200).send({      //Send the data
        "page_number": page,
        "total_pages": totalPage,
        "page_size": 10,
        "total_count": businessList.length,
        "businesses": businessList,
        "links": {
            "nextPage": "/businesses?page="+nextPage,
            "prevPage": "/businesses?page="+prevPage
        }
    });
});

// Add Business
app.post("/businesses", function(req, res, next){
    console.log("== Add Business Request", req.body);
    //Check for required fields
    if(req.body.name && req.body.address && req.body.city && req.body.state && req.body.zip && req.body.phone && req.body.category && req.body.subcategories && req.body.owner_id){
        let newBusiness = req.body;    //Grab the business info
        newBusiness.business_id = 1;            //Generate new business id
        businessList.forEach(function(business){    //Search through all businesses
            if(business.business_id >= newBusiness.business_id){     //Find highest current business id
                newBusiness.business_id = business.business_id + 1;  //Add 1 to current highest business id
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
        if(business.business_id == reqId){   //If business id matches requested id
            found = true;
            let reviews = reviewList.filter((review) => {
                return review.business_id == business.business_id;
            });
            res.status(200).send({
                "business_data": business,
                "reviews": reviews
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
        for(let i=0; i<businessList.length; i++){   //Search through all businesses
            if(businessList[i].business_id == reqId){//If business id matches requested id
                businessList[i] = req.body; //Modify the business
                found = true;
                res.status(200).send({
                    msg: "Business modified.",
                    input: businessList[i]
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
        if(businessList[i].business_id == reqId){    //If business id matches requested id
            found = true;
            businessList.splice(i, 1);  // Remove the business
            res.status(200).send({
                msg: "Business deleted.",
                id: reqId
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
    const ownedBusinesses = businessList.filter(business => business.owner_id == userId);   //Grab all businesses with owner id = requested id
    res.status(200).send(ownedBusinesses);  //Send owned list
});


//
//// Business Reviews
//

// List All Written Reviews
app.get("/reviews/user/:uId", function(req, res, next){
    console.log("== List All Written Reviews UserID:", req.params.uId);
    const userId = req.params.uId;  //Get requested userId
    const reviews = reviewList.filter(business => business.user_id == userId);  //Grab all reviews with user id = requested user id
    res.status(200).send(reviews);  //Send written review list
});

// Submit Business Review
app.post("/reviews", function(req, res, next){
    console.log("== Submit Business Review Request", req.body);
    if(req.body && req.body.star && req.body.dollar_sign && req.body.description && req.body.business_id && req.body.user_id){
        let newReview = req.body;
        if(businessList.find((business) => {
            return business.business_id == newReview.business_id;
        })){
            //Check if user has already reviewed selected business
            if(reviewList.find((review) => {
                return ((review.business_id == newReview.business_id && review.user_id == newReview.user_id));
            })){
                //If a review was found
                res.status(400).send({
                    "err": "User has already reviewed selected business."
                });
            }
            else{   //If a review was not found
                newReview.review_id = 1;
                reviewList.forEach((review) => {
                    if(review.review_id >= newReview.review_id){
                        newReview.review_id = review.review_id + 1;
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
    if(req.body && req.body.star && req.body.dollar_sign && req.body.description && req.body.business_id && req.body.user_id){
        const reqId = req.params.rId;    //Get requested id
        let found = false;
        for(let i=0; i<reviewList.length; i++){     //Search through all reviews
            if(reviewList[i].review_id == reqId){   //If review id matches requested id
                reviewList[i] = req.body; //Modify the review
                found = true;
                res.status(200).send({
                    msg: "Review modified.",
                    input: businessList[i]
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
    for(let i=0; i<reviewList.length; i++){   //Search through all reviews
        if(reviewList[i].review_id == reqId){    //If business id matches requested id
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
    const photos = photoList.filter(photo => photo.user_id == userId);  //Grab all reviews with user id = requested user id
    res.status(200).send(photos);  //Send written review list
});

app.use("*", function(req, res, next){
    res.status(404).send({err: "The requested resource was not found."});
});