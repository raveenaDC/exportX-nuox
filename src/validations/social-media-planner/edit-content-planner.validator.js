import { body } from 'express-validator';

export default [
  body('imageIdeas')
    .notEmpty()
    .withMessage('imageIdeas is required')
    .isArray({ min: 1 })
    .withMessage('please choose atleast one image idea'),
  body('dallePrompt').notEmpty().withMessage('dallePrompt is required'),
  body('posts')
    .notEmpty()
    .withMessage('posts is required')
    .isArray({ min: 1 })
    .withMessage('please choose atleast one post')
    .custom((posts) => {
      for (let post of posts) {
        if (!post.platform || !post.post) {
          throw new Error('each post must have platform and post');
        }
      }
      return true;
    }),
];
