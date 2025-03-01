const Joi = require('joi');

const userSchema = Joi.object({
    firstName: Joi.string()
        .required(),
    lastName: Joi.string()
        .required(),
    username: Joi.string()
        .required(),
    email:Joi.string().required(),
    password:Joi.string().required(),
});

module.exports=userSchema;