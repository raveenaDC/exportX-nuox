import httpStatus from 'http-status';
// import * as models from "../db/models/index.js"
import { responseHelper } from '../utils/response.helper.js';
import { paginateData } from '../utils/paginate-data.js';
import * as models from '../db/models/index.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

/**
 * @body {String} adGoal
 * @returns {Object} adGoal
 */
export async function create(req, res, next) {
  try {
    const { adGoal } = req.body;

    const adGoalExists = await models.adGoalModel.findOne({ adGoal });
    if (adGoalExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'ad goal already exists'
      );
    }

    const newAdGoal = await models.adGoalModel.create({
      adGoal: adGoal,
    });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'ad goal created successfully',
      { adGoal: newAdGoal }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @returns {Array} adGoals
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
      filter.adGoal = { $regex: new RegExp(search, 'i') };
    }

    let sortKey = {};
    if (orderBy === 'adGoal') {
      sortKey.adGoal = order;
    } else {
      sortKey.createdAt = order;
    }

    let adGoals = await models.adGoalModel
      .find(filter)
      .collation({ locale: 'en', strength: 2 })
      .sort(sortKey);

    if (!adGoals.length) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No adGoals found'
      );
    }

    const paginatedResult = paginateData(adGoals, page, pageLimit);

    return responseHelper(res, httpStatus.OK, false, '', {
      pagination: paginatedResult.pagination,
      adGoals: paginatedResult.data,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * @params {String} adGoalId
 * @returns {Object} adGoal
 */
export async function findOne(req, res, next) {
  try {
    const { adGoalId } = req.params;
    const adGoal = await models.adGoalModel.findById(adGoalId);

    return responseHelper(res, httpStatus.OK, false, 'ad goal', {
      adGoal: adGoal,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} adGoal
 * @params {String} adGoalId
 * @returns {Object} adGoal
 */
export async function update(req, res, next) {
  try {
    const { adGoalId } = req.params;
    const adGoalCheck = await models.adGoalModel.findById(adGoalId);
    if (!adGoalCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'add goal not found'
      );
    }

    const updatedAdGoal = await models.adGoalModel.findByIdAndUpdate(
      adGoalId,
      req.body,
      {
        new: true,
      }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'ad goal updated successfully',
      { adGoal: updatedAdGoal }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} adGoalId
 * @returns {Null}
 */
export async function remove(req, res, next) {
  try {
    const { adGoalId } = req.params;
    const adGoal = await models.adGoalModel.findById(adGoalId);
    if (!adGoal) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'ad goal not found'
      );
    }
    await models.adGoalModel.findByIdAndDelete(adGoalId);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'ad goal deleted successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}
