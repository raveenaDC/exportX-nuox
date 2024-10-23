import httpStatus from 'http-status';
// import * as models from "../db/models/index.js"
import { responseHelper } from '../utils/response.helper.js';
import { paginateData } from '../utils/paginate-data.js';
import * as models from '../db/models/index.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

/**
 * @body {String} toneOfVoice
 * @returns {Object} toneOfVoice
 */
export async function create(req, res, next) {
  try {
    const { toneOfVoice } = req.body;

    const toneOfVoiceExists = await models.toneOfVoiceModel.findOne({
      toneOfVoice,
    });
    if (toneOfVoiceExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'tone of voice already exists'
      );
    }

    const newToneOfVoice = await models.toneOfVoiceModel.create({
      toneOfVoice: toneOfVoice,
    });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'tone of voice created successfully',
      { toneOfVoice: newToneOfVoice }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @returns {Array} toneOfVoices
 */
export async function findAll(req, res, next) {
  try {
    let {
      page = 1,
      pageLimit = defaultPageLimit,
      orderBy = 'createdAt',
      order = 'desc',
      search = '',
    } = req.query;
    pageLimit = parseInt(pageLimit);
    page = parseInt(page);
    order = order === 'asc' ? 1 : -1;

    let filter = {};

    if (search) {
      filter.toneOfVoice = { $regex: new RegExp(search, 'i') };
    }

    let sortKey = {};
    if (orderBy === 'toneOfVoice') {
      sortKey.toneOfVoice = order;
    } else {
      sortKey.createdAt = order;
    }

    let toneOfVoices = await models.toneOfVoiceModel
      .find(filter)
      .collation({ locale: 'en', strength: 2 })
      .sort(sortKey);

    if (!toneOfVoices.length) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No toneOfVoices found'
      );
    }

    const paginatedResult = paginateData(toneOfVoices, page, pageLimit);

    return responseHelper(res, httpStatus.OK, false, '', {
      pagination: paginatedResult.pagination,
      toneOfVoices: paginatedResult.data,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * @params {String} toneOfVoiceId
 * @returns {Object} toneOfVoice
 */
export async function findOne(req, res, next) {
  try {
    const { toneOfVoiceId } = req.params;
    const toneOfVoice = await models.toneOfVoiceModel.findById(toneOfVoiceId);

    return responseHelper(res, httpStatus.OK, false, 'tone of voice', {
      toneOfVoice: toneOfVoice,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} toneOfVoice
 * @params {String} toneOfVoiceId
 * @returns {Object} toneOfVoice
 */
export async function update(req, res, next) {
  try {
    const { toneOfVoiceId } = req.params;
    const toneOfVoiceCheck =
      await models.toneOfVoiceModel.findById(toneOfVoiceId);
    if (!toneOfVoiceCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'tone of voice not found'
      );
    }

    const updatedToneOfVoice = await models.toneOfVoiceModel.findByIdAndUpdate(
      toneOfVoiceId,
      req.body,
      {
        new: true,
      }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'tone of voice updated successfully',
      { toneOfVoice: updatedToneOfVoice }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} toneOfVoiceId
 * @returns {Null}
 */
export async function remove(req, res, next) {
  try {
    const { toneOfVoiceId } = req.params;
    const toneOfVoice = await models.toneOfVoiceModel.findById(toneOfVoiceId);
    if (!toneOfVoice) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'tone of voice not found'
      );
    }

    await models.toneOfVoiceModel.findByIdAndDelete(toneOfVoiceId);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'tone of voice deleted successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}
