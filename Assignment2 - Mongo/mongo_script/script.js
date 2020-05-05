const {MongoClient} = require("mongodb");
const ObjectID = require('mongodb').ObjectID;

const mongoHost = process.env.MONGO_HOST || 'localhost';
const mongoPort = process.env.MONGO_PORT || '27017';
const mongoDB = process.env.MONGO_DATABASE;
const mongoUser = process.env.MONGO_INITDB_ROOT_USERNAME;
const mongoPassword = process.env.MONGO_INITDB_ROOT_PASSWORD;

const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDB}`;

let db = null;

function connectToDB(callback){
    MongoClient.connect(mongoUrl, function(err, client){
        if(err){
            throw err;
        }
        db = client.db(mongoDB);
        callback();
    });
};

connectToDB(() => {
    db.createUser({
        user: "test",
        pwd: "test",
        roles: [{role: "readWrite", db: "miniYelp"}]
    });

    db.collection("businesses").insertMany([
        {
          "_id": new ObjectID(0),
          "ownerId": 0,
          "name": "Block 15",
          "address": "300 SW Jefferson Ave.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-758-2077",
          "category": "Restaurant",
          "subcategory": "Brewpub",
          "website": "http://block15.com"
        },
        {
          "_id": new ObjectID(1),
          "ownerId": 1,
          "name": "Corvallis Brewing Supply",
          "address": "119 SW 4th St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-758-1674",
          "category": "Shopping",
          "subcategory": "Brewing Supply",
          "website": "http://www.lickspigot.com"
        },
        {
          "_id": new ObjectID(2),
          "ownerId": 2,
          "name": "Robnett's Hardware",
          "address": "400 SW 2nd St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-753-5531",
          "category": "Shopping",
          "subcategory": "Hardware"
        },
        {
          "_id": new ObjectID(3),
          "ownerId": 3,
          "name": "First Alternative Co-op North Store",
          "address": "2855 NW Grant Ave.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97330",
          "phone": "541-452-3115",
          "category": "Shopping",
          "subcategory": "Groceries"
        },
        {
          "_id": new ObjectID(4),
          "ownerId": 4,
          "name": "WinCo Foods",
          "address": "2335 NW Kings Blvd.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97330",
          "phone": "541-753-7002",
          "category": "Shopping",
          "subcategory": "Groceries"
        },
        {
          "_id": new ObjectID(5),
          "ownerId": 5,
          "name": "Fred Meyer",
          "address": "777 NW Kings Blvd.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97330",
          "phone": "541-753-9116",
          "category": "Shopping",
          "subcategory": "Groceries"
        },
        {
          "_id": new ObjectID(6),
          "ownerId": 6,
          "name": "Interzone",
          "address": "1563 NW Monroe Ave.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97330",
          "phone": "541-754-5965",
          "category": "Restaurant",
          "subcategory": "Coffee Shop"
        },
        {
          "_id": new ObjectID(7),
          "ownerId": 7,
          "name": "The Beanery Downtown",
          "address": "500 SW 2nd St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-753-7442",
          "category": "Restaurant",
          "subcategory": "Coffee Shop"
        },
        {
          "_id": new ObjectID(8),
          "ownerId": 8,
          "name": "Local Boyz",
          "address": "1425 NW Monroe Ave.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97330",
          "phone": "541-754-5338",
          "category": "Restaurant",
          "subcategory": "Hawaiian"
        },
        {
          "_id": new ObjectID(9),
          "ownerId": 9,
          "name": "Darkside Cinema",
          "address": "215 SW 4th St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-752-4161",
          "category": "Entertainment",
          "subcategory": "Movie Theater",
          "website": "http://darksidecinema.com"
        },
        {
          "_id": new ObjectID(10),
          "ownerId": 10,
          "name": "The Book Bin",
          "address": "215 SW 4th St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-752-0040",
          "category": "Shopping",
          "subcategory": "Book Store"
        },
        {
          "_id": new ObjectID(11),
          "ownerId": 11,
          "name": "Cyclotopia",
          "address": "435 SW 2nd St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-757-9694",
          "category": "Shopping",
          "subcategory": "Bicycle Shop"
        },
        {
          "_id": new ObjectID(12),
          "ownerId": 12,
          "name": "Corvallis Cyclery",
          "address": "344 SW 2nd St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-752-5952",
          "category": "Shopping",
          "subcategory": "Bicycle Shop"
        },
        {
          "_id": new ObjectID(13),
          "ownerId": 13,
          "name": "Oregon Coffee & Tea",
          "address": "215 NW Monroe Ave.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-752-2421",
          "category": "Shopping",
          "subcategory": "Tea House",
          "website": "http://www.oregoncoffeeandtea.com"
        },
        {
          "_id": new ObjectID(14),
          "ownerId": 14,
          "name": "Spaeth Lumber",
          "address": "1585 NW 9th St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97330",
          "phone": "541-752-1930",
          "category": "Shopping",
          "subcategory": "Hardware"
        },
        {
          "_id": new ObjectID(15),
          "ownerId": 15,
          "name": "New Morning Bakery",
          "address": "219 SW 2nd St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-754-0181",
          "category": "Restaurant",
          "subcategory": "Bakery"
        },
        {
          "_id": new ObjectID(16),
          "ownerId": 3,
          "name": "First Alternative Co-op South Store",
          "address": "1007 SE 3rd St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-753-3115",
          "category": "Shopping",
          "subcategory": "Groceries"
        },
        {
          "_id": new ObjectID(17),
          "ownerId": 7,
          "name": "The Beanery Monroe",
          "address": "2541 NW Monroe Ave.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97330",
          "phone": "541-757-0828",
          "category": "Restaurant",
          "subcategory": "Coffee Shop"
        },
        {
          "_id": new ObjectID(18),
          "ownerId": 0,
          "name": "Block 15 Brewery & Tap Room",
          "address": "3415 SW Deschutes St.",
          "city": "Corvallis",
          "state": "OR",
          "zip": "97333",
          "phone": "541-752-2337",
          "category": "Restaurant",
          "subcategory": "Brewpub",
          "website": "http://block15.com"
        }
    ]);

    db.collection("photos").insertMany([
        {
          "_id": new ObjectID(0),
          "userId": 7,
          "businessId": 8,
          "caption": "This is my dinner."
        },
        {
          "_id": new ObjectID(1),
          "userId": 25,
          "businessId": 2
        },
        {
          "_id": new ObjectID(2),
          "userId": 26,
          "businessId": 1,
          "caption": "Hops"
        },
        {
          "_id": new ObjectID(3),
          "userId": 21,
          "businessId": 14
        },
        {
          "_id": new ObjectID(4),
          "userId": 28,
          "businessId": 18,
          "caption": "Sticky Hands"
        },
        {
          "_id": new ObjectID(5),
          "userId": 21,
          "businessId": 9,
          "caption": "Popcorn!"
        },
        {
          "_id": new ObjectID(6),
          "userId": 26,
          "businessId": 8
        },
        {
          "_id": new ObjectID(7),
          "userId": 25,
          "businessId": 18,
          "caption": "Big fermentor"
        },
        {
          "_id": new ObjectID(8),
          "userId": 20,
          "businessId": 2
        },
        {
          "_id": new ObjectID(9),
          "userId": 6,
          "businessId": 15,
          "caption": "Cake!"
        }
    ]);
    
    db.collection("reviews").insertMany([
        {
          "_id": new ObjectID(0),
          "userId": 7,
          "businessId": 8,
          "dollars": 1,
          "stars": 4.5,
          "review": "Cheap, delicious food."
        },
        {
          "_id": new ObjectID(1),
          "userId": 25,
          "businessId": 2,
          "dollars": 1,
          "stars": 4,
          "review": "How many fasteners can one room hold?"
        },
        {
          "_id": new ObjectID(2),
          "userId": 26,
          "businessId": 1,
          "dollars": 1,
          "stars": 5,
          "review": "Joel, the owner, is super friendly and helpful."
        },
        {
          "_id": new ObjectID(3),
          "userId": 21,
          "businessId": 14,
          "dollars": 2,
          "stars": 4
        },
        {
          "_id": new ObjectID(4),
          "userId": 28,
          "businessId": 18,
          "dollars": 1,
          "stars": 4,
          "review": "Good beer, good food, though limited selection."
        },
        {
          "_id": new ObjectID(5),
          "userId": 21,
          "businessId": 9,
          "dollars": 1,
          "stars": 5,
          "review": "A Corvallis gem."
        },
        {
          "_id": new ObjectID(6),
          "userId": 26,
          "businessId": 8,
          "dollars": 1,
          "stars": 5,
          "review": "Yummmmmmm!"
        },
        {
          "_id": new ObjectID(7),
          "userId": 25,
          "businessId": 18,
          "dollars": 2,
          "stars": 4.5
        },
        {
          "_id": new ObjectID(8),
          "userId": 20,
          "businessId": 2,
          "dollars": 2,
          "stars": 4
        },
        {
          "_id": new ObjectID(9),
          "userId": 6,
          "businessId": 15,
          "dollars": 2,
          "stars": 5,
          "review": "Try the hazlenut torte.  It's the best!"
        }
    ]);
});