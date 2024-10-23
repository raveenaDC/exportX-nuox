import { query } from 'express-validator';

export default [
  query('projectType')
    .isIn(['social_media_post_generator', 'content_idea_generator', 'campaign_ideas'])
    .withMessage(
      'Invalid status. Should be one of: social_media_post_generator, content_idea_generator, campaign_ideas'
    ),
];
