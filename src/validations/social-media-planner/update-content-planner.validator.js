import { body } from 'express-validator';

export default [
  body('imageIdeas')
    .notEmpty()
    .withMessage('imageIdeas is required')
    .isArray({ min: 1 })
    .withMessage('imageIdeas must be an array with at least one element'),
  body('dallePrompt').notEmpty().withMessage('dallePrompt is required'),
  body('posts')
    .notEmpty()
    .withMessage('posts is required')
    .isArray({ min: 1 })
    .withMessage('posts must be an array with at least one element')
    .custom((posts) => {
      for (let post of posts) {
        if (!post.platform || !post.post || !post._id) {
          throw new Error(
            'each post must have platform, post,  _id and platform'
          );
        }
      }
      //  throw new Error('each post must have _id');
      return true;
    }),
];
