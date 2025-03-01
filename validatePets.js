const Joi = require('joi');

const petSchema = Joi.object({
    name: Joi.string()
        .required(),
    breed:Joi.string().required(),
    age:Joi.string().required(),
    owner:Joi.string().required(),
    description:Joi.string().required(),
    photo_url:Joi.string().required()
});

module.exports=petSchema;