import * as models from '../../db/models/index.js';
export async function getFullProjectDetails(projectId = '') {
  return await models.projectModel
    .findById(projectId)
    .populate({
      //by client id and populating client with adGoal and toneOfVoice
      path: 'clientId',
      model: 'Client',
      populate: {
        path: 'clientBrief',
        model: 'ClientBriefDetails',
        populate: [
          { path: 'adGoals', model: 'AdGoal', select: '_id adGoal' },
          {
            path: 'toneOfVoice',
            model: 'toneOfVoice',
            select: '_id toneOfVoice',
          },
        ],
      },
    })
    .populate({
      path: 'designBrief.toneOfVoice',
      model: 'toneOfVoice',
      select: '_id toneOfVoice',
    })
    .populate({
      path: 'projectBrief.adGoals',
      model: 'AdGoal',
      select: '_id adGoal',
    })
    .populate({
      path: 'projectBrief.toneOfVoice',
      model: 'toneOfVoice',
      select: '_id toneOfVoice',
    })
    .populate({
      path: 'clientBrief.adGoals',
      model: 'AdGoal',
      select: '_id adGoal',
    })
    .populate({
      path: 'clientBrief.toneOfVoice',
      model: 'toneOfVoice',
      select: '_id toneOfVoice',
    })
    .populate({
      path: 'contentPlanner.socialMediaPlanner',
      model: 'socialMediaPlanner',
    })
    .populate({
      path: 'projectCoordinators',
      model: 'User',
    })
    .populate({
      path: 'contentPlanner.socialMediaPlanner.plan',
      model: 'socialMediaPlanner',
      populate: {
        path: 'items.posts.images',
        model: 'Image',
      },
    });
}
