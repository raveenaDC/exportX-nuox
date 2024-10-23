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
import { seedData } from '../db/seed-data.js';
/**
 * @body {String} roleName
 * @body {String} roleDesc
 * @body {String} permissionTitle
 * @body {String} permissionDesc
 * @returns {Object} role
 */
export async function create(req, res, next) {
  try {
    let {
      roleName,
      roleDesc,
      permissionTitle,
      permissionDesc,
      rolePermissions,
    } = req.body;
    let postRole = await capitalizeEachWordFirstLetter(roleName);
    if (
      postRole == 'Admin' ||
      postRole == 'Client' ||
      postRole == 'Client User'
    ) {
      let roles = await models.roleModel.find({
        $or: [
          { roleName: 'admin', roleName: 'client', roleName: 'client User' },
        ],
      });
      if (roles) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'Role already exists'
        );
      }
    }
    const roleExists = await models.roleModel.findOne({ roleName: postRole });
    if (roleExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Role already exists'
      );
    }

    const role = await models.roleModel.create({
      roleName: postRole,
      roleDesc,
      permissionTitle,
      permissionDesc,
    });
    await models.permissionModel.create({
      role: role._id,
      permissions: rolePermissions
        ? rolePermissions
        : seedData.defaultPermissions,
    });
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'New role created successfully',
      { role }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @returns {Array} roles
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
      filter.roleName = { $regex: new RegExp(search, 'i') };
    }
    let sortKey = {};
    if (orderBy === 'roleName') {
      sortKey.roleName = order;
    } else {
      sortKey.createdAt = order;
    }

    let roles = await models.roleModel
      .find(filter)
      .collation({ locale: 'en', strength: 2 })
      .sort(sortKey);
    if (!roles.length) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'No roles found');
    }
    const paginatedResult = paginateData(roles, page, pageLimit);
    return responseHelper(res, httpStatus.OK, false, '', {
      pagination: paginatedResult.pagination,
      roles: paginatedResult.data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function findRoleById(req, res, next) {
  try {
    const { roleId } = req.params;
    const role = await models.roleModel
      .findById(roleId)
      .select('roleName isActive');
    let permission = await models.permissionModel
      .findOne({ role: role._id })
      .select('permissions');
    return responseHelper(res, httpStatus.OK, false, 'role', {
      role: role,
      rolePermissions: permission,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function findAllActiveRole(req, res, next) {
  try {
    const roles = await models.roleModel.find({ isActive: true });
    if (!roles)
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'No roles found');
    return responseHelper(res, httpStatus.OK, false, '', { roles: roles });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { roleName, rolePermissions } = req.body;
    let changeRole;
    if (roleName) {
      changeRole = await capitalizeEachWordFirstLetter(roleName);
    }

    if (
      changeRole == 'Admin' ||
      changeRole == 'Client' ||
      changeRole == 'Client User'
    ) {
      let roles = await models.roleModel.find({
        $or: [
          { roleName: 'admin', roleName: 'client', roleName: 'client User' },
        ],
      });
      if (roles) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'Role already exists'
        );
      }
    }

    const role = await models.roleModel.findById(id);
    if (!role) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'role not found');
    }
    const existingRole = await models.roleModel.findOne({
      roleName: changeRole,
      _id: { $ne: id },
    });
    if (existingRole) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Role already exists: ${existingRole.roleName}`
      );
    }

    const permissionsDocument = await models.permissionModel.findById(
      rolePermissions._id
    );
    if (!permissionsDocument) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Permission not found `
      );
    }
    permissionsDocument.permissions = rolePermissions.permissions;

    await permissionsDocument.save();
    const updatedRole = await models.roleModel.findByIdAndUpdate(
      id,
      { roleName: changeRole },
      {
        new: true,
      }
    );
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Role is updated successfully',
      { role: updatedRole, rolePermissions: permissionsDocument }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const roleModelCheck = await models.roleModel.findById(id);
    if (!roleModelCheck) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Role not found');
    }
    if (isActive === roleModelCheck.isActive && isActive) {
      return responseHelper(res, httpStatus.CONFLICT, true, 'Already enabled');
    } else if (isActive === roleModelCheck.isActive && !isActive) {
      return responseHelper(res, httpStatus.CONFLICT, true, 'Already disabled');
    }

    const updatedStatus = await models.roleModel.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `Role ${isActive ? 'enabled' : 'disabled'} successfully`,
      { Role: updatedStatus }
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

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const role = await models.roleModel.findById(id);
    if (!role) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'role not found');
    }

    let userRole = await models.userModel.findOne({ roleId: id });
    if (userRole) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'You can not delete.The role has already assigned to a user'
      );
    }

    await models.roleModel.findByIdAndDelete(id);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Role deleted successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}
