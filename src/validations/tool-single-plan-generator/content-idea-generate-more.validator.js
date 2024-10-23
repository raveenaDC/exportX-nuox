import { body } from 'express-validator';

export default [
  body('contentIdeas')
    .notEmpty()
    .withMessage('contentIdeas is required')
    .isArray({ min: 1 })
    .withMessage('please choose atleast one content idea'),
  body('contentIdeas').custom((value) => {
    for (const idea of value) {
      if (!idea.title || !idea.content || !('selected' in idea)) {
        throw new Error(
          'Each content idea must have title, content, and selected fields'
        );
      }
    }

    return true;
  }),
];
