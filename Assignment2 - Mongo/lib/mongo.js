const {MongoClient} = require("mongodb");

const mongoHost = process.env.MONGO_HOST || 'localhost';
const mongoPort = process.env.MONGO_PORT || '27017';
const mongoDB = process.env.MONGO_DATABASE;
const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;

const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDB}`;

let db = null;

exports.connectToDB = function(callback){
    MongoClient.connect(mongoUrl, function(err, client){
        if(err){
            throw err;
        }
        db = client.db(mongoDB);
        callback();
    });
};

exports.getDBReference = function(){
    return db;
};

exports.getNextSequence = async function(name){
    let ret = await db.collection("counters").findOneAndUpdate(
        {_id: name},
        {$inc: {value: 1}},
    );
    return ret.value.value;
}