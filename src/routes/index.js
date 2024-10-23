import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import { errorHandleMiddleware } from '../middleware/error-handle.middleware.js';

import designationRoute from './user-designation.route.js';
import userRoute from './user.route.js';
import authRoute from './auth.route.js';
import roleRoute from './roles.route.js';

import projectRoute from './project/project.route.js';
import projectDiscussionRoute from './project/discussion.route.js';
import projectDocumentRoute from './project/document.route.js';
import projectUserManagementRoute from './project/user-management.route.js';
import projectContentPlannerCpRoute from './project/content-planner.route.cp.js';
import clientDashboardContentPlannerRoute from './dashboard/client-dashboard/content-planner.route.cp.js';
import projectImageGenerationRoute from './project/image-generation.route.js';

import clientRoute from './client.js';
import clientUserRoute from './client-user.js';
import adGoalRoute from './ad-goal.route.js';
import toneOfVoiceRoute from './tone-of-voice.route.js';
import taskRoute from './task.route.js';
import permissionRoute from './permission.route.js';
import generateRoute from './tools.route.js';
import promptsRoute from './prompts.route.js';

import clientDashboardRoute from './dashboard/client-dashboard/client-dashboard.route.js';
import toolSinglePlanGenerateRoute from './tool-single-plan-generator.route.js';
import discussionForumRoute from './dashboard/client-dashboard/discussion.route.js';
import socialMediaPostRoute from './dashboard/client-dashboard/social-media-post.route.js';
import userManagementRoute from './dashboard/client-dashboard/user-management.route.js';

//project manager dashboard routes
import projectManagerDashboardRoute from './dashboard/project-manager-dashboard/project-manager-dashboard.route.js';
import projectManagerUserManagementRoute from '../routes/dashboard/project-manager-dashboard/pm-user-management.route.js';
import projectManagerClientManagementRoute from '../routes/dashboard/project-manager-dashboard/pm-client-management.route.js';

//poster generator route
import posterGeneratorRoute from './poster-generator.route.js';

import socialMediaPlannerRoute from './social-media-planner.route.js';
import notificationRoute from './notification.route.js';

import transformPromptRoute from './tools-customise/tranform-prompt.route.js';
import languageTranslationPromptRoute from './tools-customise/language-translation-prompt.route.js';
import customPromptRoute from './tools-customise/custom-prompt.route.js';
import toolFeaturesRoute from './tools-customise/tool-features.route.js';

export default function initializeRoutes(app) {
  app.use('/user/designation', designationRoute);
  app.use('/users', userRoute);
  app.use('/clients', clientRoute);
  app.use('/auth', authRoute);
  app.use('/client-user', clientUserRoute);
  app.use('/roles', roleRoute);

  //project related routes
  app.use('/projects', projectRoute);
  app.use('/projects', projectDiscussionRoute);
  app.use('/projects', projectDocumentRoute);
  app.use('/projects', projectUserManagementRoute);
  app.use('/projects', projectContentPlannerCpRoute);
  app.use('/projects/image-generation', projectImageGenerationRoute);

  app.use('/ad-goals', adGoalRoute);
  app.use('/tone-of-voices', toneOfVoiceRoute);
  app.use('/tasks', taskRoute);
  app.use('/permissions', permissionRoute);
  app.use('/tools', generateRoute);
  app.use('/prompts', promptsRoute);
  app.use('/tools/single-plan-generator', toolSinglePlanGenerateRoute);

  //client dashboard routes
  app.use('/client-dashboard', clientDashboardRoute);
  app.use('/client-dashboard/user-management', userManagementRoute);
  app.use('/client-dashboard/project', discussionForumRoute);
  app.use('/client-dashboard', socialMediaPostRoute);
  app.use('/client-dashboard', clientDashboardContentPlannerRoute);

  //project manager dahsboard routes
  app.use('/pm-dashboard', projectManagerDashboardRoute);
  app.use('/pm-dashboard/user-management', projectManagerUserManagementRoute);
  app.use(
    '/pm-dashboard/client-management',
    projectManagerClientManagementRoute
  );

  //poster generator routes
  app.use('/poster-generator/projects', posterGeneratorRoute);

  //socia media planner routes
  app.use('/social-media-planner', socialMediaPlannerRoute);
  app.use('/notifications', notificationRoute);

  //tools-customaziation routes

  app.use('/custom-tools/transform', transformPromptRoute);
  app.use('/custom-tools/translate', languageTranslationPromptRoute);
  app.use('/custom-tools/custom', customPromptRoute);
  app.use('/tool-features', toolFeaturesRoute);

  app.use(errorHandleMiddleware);
  //index route
  app.get('/', (req, res) => {
    responseHelper(res, httpStatus.OK, false, 'server is up and running');
  });

  app.all('*', (req, res) => {
    responseHelper(
      res,
      httpStatus.NOT_FOUND,
      true,
      'requested resource not exists'
    );
  });
}
