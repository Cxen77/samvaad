import Joi from 'joi';

export const signupSchema = Joi.object({
    name: Joi.string().required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    course: Joi.string().allow(''),
    year: Joi.string().allow(''),
    bio: Joi.string().allow(''),
    skills: Joi.array().items(Joi.string()),
    socials: Joi.object({
        github: Joi.string().allow(''),
        linkedin: Joi.string().allow(''),
        twitter: Joi.string().allow(''),
        instagram: Joi.string().allow(''),
        portfolio: Joi.string().allow('')
    })
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const postSchema = Joi.object({
    content: Joi.string().allow(''),
    image: Joi.string().allow('')
}).unknown(true);

export const commentSchema = Joi.object({
    text: Joi.string().required()
});

export const teamSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required()
});

export const eventSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    date: Joi.date().required(),
    location: Joi.string().required(),
    category: Joi.string().valid('Hackathon', 'Workshop', 'Seminar', 'Tournament', 'Meetup', 'Project', 'Game', 'Sport').required(),
    prize: Joi.string().allow(''),
    imageUrl: Joi.string().uri().allow(''),
    maxTeamSize: Joi.number().min(1).max(50).default(1),
    isMultiCollege: Joi.boolean().default(true),
    allowTeamRegistration: Joi.boolean().default(false),
    requireUSN: Joi.boolean().default(false)
});
