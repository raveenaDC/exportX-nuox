import { Router } from 'express';
import * as toneOfVoiceService from '../services/tone-of-voice.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';
const toneOfVoice = Router();

toneOfVoice.get(
  '/',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('get-all-tone-of-voices'),
  toneOfVoiceService.findAll
);

toneOfVoice.get(
  '/:toneOfVoiceId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-tone-of-voice'),
  toneOfVoiceService.findOne
);
toneOfVoice.post(
  '/',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('create-tone-of-voice'),
  validators.toneOfVoiceValidator,
  middlewares.validationCheckMiddleWare,
  toneOfVoiceService.create
);

toneOfVoice.patch(
  '/:toneOfVoiceId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('update-tone-of-voice'),
  validators.toneOfVoiceValidator,
  middlewares.validationCheckMiddleWare,
  toneOfVoiceService.update
);
toneOfVoice.delete(
  '/:toneOfVoiceId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('delete-tone-of-voice'),
  toneOfVoiceService.remove
);

export default toneOfVoice;
