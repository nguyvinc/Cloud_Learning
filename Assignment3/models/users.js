/*
 * User schema and data accessor methods
 */

const mysqlPool = require("../lib/mysqlPool");
const {extractValidFields} = require("../lib/validation");
const bcrypt = require("bcryptjs");

// Schema describing required/optional fields of a user object
const UserSchema = {
    name: {required: true},
    email: {required: true},
    password: {required: true},
    admin: {required: false}
};
exports.UserSchema = UserSchema;


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