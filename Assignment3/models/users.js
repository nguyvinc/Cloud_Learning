/*
 * User schema and data accessor methods
 */

const mysqlPool = require("../lib/mysqlPool");
const {extractValidFields} = require("../lib/validation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const secretKey = "yupperino";


// Schema describing required/optional fields of a user object
const UserSchema = {
    name: {required: true},
    email: {required: true},
    password: {required: true},
    admin: {required: false}
};
exports.UserSchema = UserSchema;

const LoginSchema = {
    email: {required: true},
    password: {required: true}
};
exports.LoginSchema = LoginSchema;


async function insertNewUser(userInfo){
    //Extract all required fields from the input
    let validatedUser = extractValidFields(userInfo, UserSchema);

    //Check for a unique email
    const [email] = await mysqlPool.query(
        "SELECT * FROM `users` WHERE `email`=?",
        validatedUser.email
    );
    if(email[0]){   //If there's a user with the same email, return false
        return false;
    }

    /*
     * Salt and hash the entered password
     * Update the password field to the hashed password
     */
    const passwordHash = await bcrypt.hash(validatedUser.password, 5);
    validatedUser.password = passwordHash;

    //Insert new user and return new id
    const [result] = await mysqlPool.query(
        "INSERT INTO `users` SET ?",
        validatedUser
    );
    return result.insertId;
}
exports.insertNewUser = insertNewUser;


async function loginUser(info){
    const login = await getUser({email: info.email}, true);
    if(!(login && await bcrypt.compare(info.password, login.password))){    //If no user or passwords don't match, return an error
        return false;
    }
    else{   //Else if user exists and passwords match
        //Create a payload with the user's id
        const payload = {sub: login.id, admin: login.admin};

        //Return a JSON Web Token
        return jwt.sign(payload, secretKey, {expiresIn: "24h"});
    }
}
exports.loginUser = loginUser;


async function getUser(info, getPass){
    let query, data;
    if(getPass){    //Get all fields
        query = "SELECT * FROM `users` WHERE ";
    }
    else{           //Get all fields except password
        query = "SELECT `id`, `name`, `email`, `admin` FROM `users` WHERE ";
    }

    if(info.id){    //If id was passed in, grab data by id
        query += "`id`=?";
        data = info.id;
    }
    else{           //If email was passed in, grab by email
        query += "`email`=?";
        data = info.email;
    }
    
    const [user] = await mysqlPool.query(
        query,
        data
    );
    return user[0];
}
exports.getUser = getUser;

function requireAuthentication(req, res, next){
    const authHeader = req.get("Authorization") || "";
    const authHeaderParts = authHeader.split(" ");

    const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null;
    try{
        const payload = jwt.verify(token, secretKey);
        req.user = payload.sub;
        req.admin = payload.admin;
        next();
    }
    catch(err){
        res.status(401).send({
            error: "Invalid authentication token provided."
        })
    }
}
exports.requireAuthentication = requireAuthentication;