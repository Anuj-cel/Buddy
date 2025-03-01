const Joi = require('joi');

const adoptSchema = Joi.object({
    Name: Joi.string()
        .required(),
    username:Joi.string().required(),
    email:Joi.string().required(),
    phone: Joi.string()
        .pattern(/^\d{10}$/) // Only 10-digit numbers
        .required()
        .messages({
            'string.empty': 'Phone number is required.',
            'string.pattern.base': 'Phone number must be a 10-digit number.',
        }),
    address:Joi.string().required(),
});

module.exports=adoptSchema;