import httpStatus from 'http-status';
import { generateRandomPassword } from '../utils/generate-random-password.helper.js';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import { checkPermission } from '../utils/client-user.permission.js';
import { Types } from 'mongoose';
import { generatePasswordHash } from '../utils/encryption.helper.js';
import { sendMail } from '../utils/mail.helper.js';
import { createAccountTemplate } from '../registry/mail-templates/create-account.template.js';
const defaultPageLimit = process.env.PAGE_LIMIT;
import { paginateData } from '../utils/paginate-data.js';
import { getClientUserName } from '../utils/db-helper/notification-creator.helper.js';

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export async function create(req, res, next) {
  try {
    const userData = req.body;
    const clientId = req.params;
    if (!Array.isArray(userData)) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Invalid data format'
      );
    }

    const responses = [];
    const id = clientId.clientId;
    for (const user of userData) {
      const { clientUserName, clientUserEmail, view, action } = user;
      const client = await models.clientModel.findById(id);

      if (!client) {
        responses.push({
          status: httpStatus.NOT_FOUND,
          error: true,
          message: 'Client not found',
        });
        continue;
      }
      let role = await models.roleModel.findOne({ roleName: 'client user' });

      const emailExists = await models.clientUserModel.findOne({
        clientUserEmail: clientUserEmail,
      });

      if (emailExists) {
        responses.push({
          status: httpStatus.CONFLICT,
          error: true,
          message: `This ${emailExists.clientUserEmail} email already exists`,
        });
        continue;
      }

      const passcode = generateRandomPassword();

      try {
        const clientUser = await models.clientUserModel.create({
          clientUserName,
          clientUserEmail,
          roleId: role._id,
          password: await generatePasswordHash(passcode),
          clientId: id,
          view,
          action,
        });

        const frontendUrl = process.env.FRONTEND_URL + '/auth/login';
        const subject = 'Account created successfully';
        const content = createAccountTemplate(
          clientUserName,
          clientUserEmail,
          passcode,
          frontendUrl
        );
        const mailResponse = await sendMail(clientUserEmail, subject, content);
        //save email response in db
        await models.emailSendModel.create({
          to: clientUserEmail,
          messageId: mailResponse.messageId,
          subject,
          content,
        });

        const responseClientUser = await models.clientUserModel
          .findById(clientUser._id)
          .select('-password');

        responses.push({
          status: httpStatus.CREATED,
          error: false,
          message: 'Added new client user successfully',
          data: { clientUser: responseClientUser },
        });
      } catch (error) {
        responses.push({
          status: httpStatus.INTERNAL_SERVER_ERROR,
          error: true,
          message: error.message,
        });
      }
    }

    // Send a single response after the loop completes
    return res.json(responses);
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function findAll(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    let { pageLimit, search } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    let filter = {};
    if (search) {
      filter = {
        'clientUserDetails.name': { $regex: new RegExp(search, 'i') },
      };
    }
    const clientUsers = await models.clientUserModel.aggregate([
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'clientDetails',
        },
      },
      {
        $unwind: '$clientDetails',
      },
      {
        $project: {
          _id: 0,
          clientUserDetails: {
            name: '$clientUserName',
            email: '$clientUserEmail',
            profile: '$clientUserImage',
            viewPermission: '$view',
            actionPermission: '$action',
            Id: '$_id',
          },
          clientDetails: {
            clientId: '$clientDetails._id',
            clientFirstName: '$clientDetails.firstName',
            clientLastName: '$clientDetails.lastName',
            clientEmail: '$clientDetails.email',
            clientImage: '$clientDetails.clientImage',
            clientBrandUrl: '$clientDetails.brandUrl',
            clientBrandName: '$clientDetails.brandName',
            clientBrandDescription: '$clientDetails.brandDescription',
          },
        },
      },
      { $match: filter },
    ]);

    return responseHelper(res, httpStatus.OK, false, 'client users', {
      pagination: {
        pages: pageArray,
        total: totalCount,
        activePage: page,
        pageLimit: pageLimit,
      },
      clientUsers: clientUsers,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function findAllByClientId(req, res, next) {
  try {
    const { clientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    let { pageLimit, search } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    let filter = {};

    if (search) {
      filter = {
        'clientUserDetails.name': { $regex: new RegExp(search, 'i') },
      };
    }

    const client = await models.clientModel.findById(clientId);
    if (!client)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found',
        {}
      );
    const clientUsers = await models.clientUserModel.aggregate([
      { $match: { clientId: new Types.ObjectId(clientId) } },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'clientDetails',
        },
      },
      {
        $unwind: '$clientDetails',
      },
      {
        $project: {
          _id: 0,
          clientUserDetails: {
            name: '$clientUserName',
            email: '$clientUserEmail',
            profile: '$clientUserImage',
            viewPermission: '$view',
            actionPermission: '$action',
            Id: '$_id',
          },
          clientDetails: {
            clientId: '$clientDetails._id',
            clientFirstName: '$clientDetails.firstName',
            clientLastName: '$clientDetails.lastName',
            clientEmail: '$clientDetails.email',
            clientImage: '$clientDetails.clientImage',
            clientBrandUrl: '$clientDetails.brandUrl',
            clientBrandName: '$clientDetails.brandName',
            clientBrandDescription: '$clientDetails.brandDescription',
          },
        },
      },
      { $match: filter },
    ]);

    clientUsers.sort((a, b) =>
      a.clientUserDetails.name.localeCompare(b.clientUserDetails.name)
    );
    const paginationResult = await paginateData(clientUsers, page, pageLimit);
    return responseHelper(res, httpStatus.OK, false, 'Client users', {
      pagination: paginationResult.pagination,
      clientUsers: paginationResult.data,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
/**
 * list user details and client using client user Id
 * @param {clientUserId as id} req
 * @param {clientUser} res
 * @returns {object}
 */
export async function findOne(req, res, next) {
  try {
    const { id } = req.params;
    const clientUser = await models.clientUserModel
      .findById(id)
      .populate('clientId')
      .exec();
    if (!clientUser)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No client user found'
      );

    return responseHelper(res, httpStatus.OK, false, '', {
      clientUser: {
        clientUserId: clientUser._id,
        clientUserName: clientUser.clientUserName,
        clientUserEmail: clientUser.clientUserEmail,
        clientUserImage: clientUser.clientUserImage,
        actionPermission: clientUser.action,
        viewPermission: clientUser.view,
        clientDetails: clientUser.clientId,
      },
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function givePermission(req, res, next) {
  try {
    const { action, view } = req.body;
    const user = await models.clientUserModel.findById(req.params.clientUserId);
    if (!user) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client user not found'
      );
    }
    const permissionCheck = checkPermission(user, action, view);

    if (permissionCheck.status === 'found') {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        permissionCheck.message
      );
    } else {
      const updateFields = {};
      if (action !== undefined) {
        updateFields.action = action;
      }
      if (view !== undefined) {
        updateFields.view = view;
      }

      await models.clientUserModel.findByIdAndUpdate(
        req.params.clientUserId,
        updateFields
      );
      return responseHelper(
        res,
        httpStatus.CREATED,
        false,
        'Permission updated.',
        {}
      );
    }
  } catch (error) {
    return next(new Error(error));
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const clientUser = await models.clientUserModel.findById(id);
    const name = await getClientUserName(id);
    if (!clientUser) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client user not found'
      );
    }

    let role = await models.roleModel.findById(clientUser.roleId);
    if (role.roleName === 'client') {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `${name} is a client and can not remove a client`
      );
    }
    let projects = await models.projectModel.find({
      clientId: clientUser.clientId,
      owner: id,
    });
    if (projects.length > 0) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `${name} is a project owner and can not remove a project owner`
      );
    }
    await models.clientUserModel.findByIdAndDelete(id);

    let projectAssignee = await models.projectModel.find({
      clientId: clientUser.clientId,
    });
    await Promise.all(
      projectAssignee.map(async (project) => {
        project.clientUsers = project.clientUsers.filter(
          (user) => user.clientUser.toString() !== id
        );
        await project.save();
      })
    );
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `${name} is removed from client users list`
    );
  } catch (error) {
    return next(new Error(error));
  }
}
