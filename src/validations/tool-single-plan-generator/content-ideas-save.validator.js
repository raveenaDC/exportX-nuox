import { body } from 'express-validator';

export default [
  body('arabicContentIdeas').custom((value, { req }) => {
    const arabicContentIdeas = req.body.arabicContentIdeas;
    const englishContentIdeas = req.body.englishContentIdeas;

    if (!arabicContentIdeas || !englishContentIdeas) {
      throw new Error('arabicContentIdeas or englishContentIdeas is required');
    }
    if (value) {
      for (const idea of value) {
        if (!idea.title || !idea.content || !('selected' in idea)) {
          throw new Error(
            'Each Arabic content idea must have title, content, and selected fields'
          );
        }
      }
    }

    return true;
  }),

  body('englishContentIdeas').custom((value, { req }) => {
    const arabicContentIdeas = req.body.arabicContentIdeas;
    const englishContentIdeas = req.body.englishContentIdeas;

    if (!arabicContentIdeas || !englishContentIdeas) {
      throw new Error('arabicContentIdeas or englishContentIdeas is required');
    }
    if (value) {
      for (const idea of value) {
        if (!idea.title || !idea.content || !('selected' in idea)) {
          throw new Error(
            'Each English content idea must have title, content, and selected fields'
          );
        }
      }
    }

    return true;
  }),
];
