import httpStatus from 'http-status';
// import * as models from "../db/models/index.js"
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import { paginateData } from '../utils/paginate-data.js';
import {
  lowercaseEachWordFirstLetter,
  capitalizeEachWordFirstLetter,
} from '../utils/letter-case-change.helper.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function create(req, res) {
  try {
    const { designation } = req.body;
    let postDesignaion = await capitalizeEachWordFirstLetter(designation);
    if (
      postDesignaion == 'Admin' ||
      postDesignaion == 'Client' ||
      postDesignaion == 'Client User'
    ) {
      let designations = await models.roleModel.find({
        $or: [
          {
            designation: 'admin',
            designation: 'client',
            designation: 'client User',
          },
        ],
      });
      if (designations) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'Designation already exists'
        );
      }
    }
    if (!designation)
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Designation required'
      );
    const existingDesignations = await models.userDesignationModel.findOne({
      designation: postDesignaion,
    });
    if (existingDesignations) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Designation already exist: ${existingDesignations.designation}`
      );
    }

    const newDesignation = await models.userDesignationModel.create({
      designation: postDesignaion,
    });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'User designation created successfully',
      { newDesignation }
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      error.message
    );
  }
}

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
      filter.designation = { $regex: new RegExp(search, 'i') };
    }

    let sortKey = {};
    if (orderBy === 'designation') {
      sortKey.designation = order;
    } else {
      sortKey.createdAt = order;
    }

    let designations = await models.userDesignationModel
      .find(filter)
      .collation({ locale: 'en', strength: 2 })
      .sort(sortKey);

    if (!designations.length) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No designations found'
      );
    }

    const paginatedResult = paginateData(designations, page, pageLimit);

    return responseHelper(res, httpStatus.OK, false, '', {
      pagination: paginatedResult.pagination,
      designations: paginatedResult.data,
    });
  } catch (error) {
    return next(error);
  }
}
export async function findAllActiveDesignation(req, res) {
  try {
    const designation = await models.userDesignationModel.find({
      isActive: true,
    });

    return responseHelper(res, httpStatus.OK, false, 'user designation', {
      designation: designation,
    });
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      error.message
    );
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    let { designation } = req.body;
    let changeDesignation;
    if (designation) {
      changeDesignation = await capitalizeEachWordFirstLetter(designation);
    }
    if (
      changeDesignation == 'Admin' ||
      changeDesignation == 'Client' ||
      changeDesignation == 'Client User'
    ) {
      let designations = await models.roleModel.find({
        $or: [
          {
            designation: 'admin',
            designation: 'client',
            designation: 'client User',
          },
        ],
      });
      if (designations) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'Designation already exists'
        );
      }
    }
    const designationCheck = await models.userDesignationModel.findById(id);
    if (!designationCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Designation not found'
      );
    }
    const existingDesignation = await models.userDesignationModel.findOne({
      designation: changeDesignation,
      _id: { $ne: id },
    });
    if (existingDesignation) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Designation already exists: ${existingDesignation.designation}`
      );
    }

    const updatedDesignation =
      await models.userDesignationModel.findByIdAndUpdate(
        id,
        { designation: changeDesignation },
        {
          new: true,
        }
      );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Designation updated successfully',
      { designation: updatedDesignation }
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      error.message
    );
  }
}

export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const designationCheck = await models.userDesignationModel.findById(id);
    if (!designationCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Designation not found'
      );
    }
    if (isActive === designationCheck.isActive && isActive) {
      return responseHelper(res, httpStatus.CONFLICT, true, 'Already enabled');
    } else if (isActive === designationCheck.isActive && !isActive) {
      return responseHelper(res, httpStatus.CONFLICT, true, 'Already disabled');
    }

    const updatedDesignation =
      await models.userDesignationModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `Designation ${isActive ? 'enabled' : 'disabled'} successfully`,
      { designation: updatedDesignation }
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      error.message
    );
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    const designation = await models.userDesignationModel.findById(id);
    if (!designation) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Designation not found'
      );
    }

    let userDesignation = await models.userModel.findOne({ designation: id });
    if (userDesignation) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'This designation is already assigned to a user'
      );
    }
    await models.userDesignationModel.findByIdAndDelete(id);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Designation deleted successfully'
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      error.message
    );
  }
}
