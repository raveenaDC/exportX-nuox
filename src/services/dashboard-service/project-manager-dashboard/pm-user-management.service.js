import httpStatus from 'http-status';
import { Types } from 'mongoose';
import * as models from '../../../db/models/index.js';
import { sendMail } from '../../../utils/mail.helper.js';
import { createAccountTemplate } from '../../../registry/mail-templates/create-account.template.js';
import { generateRandomPassword } from '../../../utils/generate-random-password.helper.js';
import { generatePasswordHash } from '../../../utils/encryption.helper.js';
import { paginateData } from '../../../utils/paginate-data.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function create(req, res, next) {
  try {
    const { firstName, lastName, email, designation, role } = req.body;
    // if (req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }

    const emailExists = await models.userModel.findOne({ email });
    if (emailExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'email already  exists'
      );
    }

    const roleExists = await models.roleModel.findOne({
      _id: role,
      isActive: true,
    });
    if (!roleExists) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Role not found or Please Active this role'
      );
    }

    const userPost = await models.userDesignationModel.findOne({
      _id: designation,
      isActive: true,
    });
    if (!userPost) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Designation not found or please active this designation'
      );
    }
    const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    const password = generateRandomPassword();

    const user = await models.userModel.create({
      firstName: name,
      lastName,
      email,
      designation,
      // projectId: project,
      roleId: role,
      password: await generatePasswordHash(password),
    });

    const selectedUser = await models.userModel
      .findById(user._id)
      .select(
        '_id firstName lastName email userImage designation type systemAccess projectId'
      );

    const subject = 'Account created successfully';
    const content = createAccountTemplate(firstName, email, password);
    const mailResponse = await sendMail(email, subject, content);
    //save email response in db
    await models.emailSendModel.create({
      to: email,
      messageId: mailResponse.messageId,
      subject,
      content,
    });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'new user created successfully',
      { user: selectedUser }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function findOne(req, res, next) {
  try {
    const { id } = req.params;

    const user = await models.userModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'roles',
          localField: 'roleId',
          foreignField: '_id',
          as: 'roleDetails',
        },
      },
      {
        $lookup: {
          from: 'userdesignations',
          localField: 'designation',
          foreignField: '_id',
          as: 'userDesignation',
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'projectDetails',
        },
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'taskDetails',
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          userImage: 1,
          contactNo: 1,
          isdCode: 1,
          country: 1,
          userDesignation: { $arrayElemAt: ['$userDesignation', 0] },
          type: 1,
          systemAccess: 1,
          roleDetails: { $arrayElemAt: ['$roleDetails', 0] },
          createdAt: 1,
          updatedAt: 1,
          'projectDetails.name': 1,
          'projectDetails.type': 1,
          'projectDetails.owner': 1,
          'projectDetails.description': 1,
          'projectDetails.startDate': 1,
          'projectDetails.endDate': 1,
          'projectDetails._id': 1,
          'projectDetails.status': 1,
          'projectDetails.projectBrief': 1,
          'taskDetails.projectId': 1,
          'taskDetails._id': 1,
          'taskDetails.name': 1,
          'taskDetails.type': 1,
          'taskDetails.stage': 1,
          'taskDetails.approved': 1,
        },
      },
    ]);

    if (!user)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'User not found',
        {}
      );

    const userProjects = user[0].projectDetails;

    const projectCounts = {
      ongoing: userProjects.filter((project) => project.status === 'Ongoing')
        .length,
      completed: userProjects.filter(
        (project) => project.status === 'Completed'
      ).length,
      pending: userProjects.filter((project) => project.status === 'Pending')
        .length,
    };

    user[0].projectCounts = projectCounts;

    return responseHelper(res, httpStatus.OK, false, '', {
      user: user[0],
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function findAll(req, res, next) {
  try {
    let { pageLimit, orderBy, search, order, role, page } = req.query;
    // if (req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }

    pageLimit = parseInt(pageLimit || defaultPageLimit);
    page = parseInt(page || 1);
    order = order === 'asc' ? 1 : -1;
    let sort = { createdAt: order };
    sort = orderBy === 'name' ? { name: order } : sort;
    sort = orderBy === 'designation' ? { designation: order } : sort;

    //find matching designations based on search
    const matchedDesignations = await models.userDesignationModel.find({
      designation: { $regex: new RegExp(search, 'i') },
    });
    const designationIds = matchedDesignations.map(
      (designation) => designation._id
    );
    const rolesId = role ? role.split('$') : [];
    const query = {
      $or: [
        { email: { $regex: new RegExp(search, 'i') } },
        { firstName: { $regex: new RegExp(search, 'i') } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: new RegExp(search, 'i'),
            },
          },
        },
        { lastName: { $regex: new RegExp(search, 'i') } },
        { designation: { $in: designationIds } },
      ],
    };
    if (rolesId.length > 0) query.roleId = { $in: rolesId };

    let users = await models.userModel
      .find(query)
      .populate({
        path: 'roleId',
        select: 'roleName isActive permissions',
      })
      .populate({
        path: 'designation',
        select: 'designation isActive',
      })
      .populate({
        path: 'projectId',
        select:
          'name type owner description startDate endDate _id projectBrief projectId',
      })
      .populate({
        path: 'taskId',
        select: '_id name type stage approved',
      })
      .select(
        '_id firstName lastName email userImage roleId contactNo isdCode country type systemAccess createdAt updatedAt'
      )
      .sort(sort);

    //sort by designation
    if (Object.keys(sort)[0] === 'designation') {
      users.sort((a, b) => {
        const designationA =
          a.designation && a.designation.designation
            ? a.designation.designation
            : '';
        const designationB =
          b.designation && b.designation.designation
            ? b.designation.designation
            : '';
        return order === 1
          ? designationA.localeCompare(designationB)
          : designationB.localeCompare(designationA); // Descending order
      });
    }

    //sort by name
    if (Object.keys(sort)[0] === 'name') {
      users.sort((a, b) => {
        const nameA = (a.firstName + ' ' + a.lastName).toLowerCase();
        const nameB = (b.firstName + ' ' + b.lastName).toLowerCase();
        return order === 1
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    //pop admin user
    users = users.filter((user) => user.email !== 'admin@nuox.com');

    //apply pagination
    const paginationResult = paginateData(users, page, pageLimit);
    paginationResult.pagination.orderBy = orderBy;
    paginationResult.pagination.order = order;
    let result = paginationResult.data;
    const transformedUsers = result.map((user) => ({
      ...user.toObject(),
      projectDetails: user.projectId,
      taskDetails: user.taskId,
      roleDetails: user.roleId,
      userDesignation: user.designation,
      taskId: undefined,
      projectId: undefined,
      roleId: undefined,
      designation: undefined,
    }));
    return responseHelper(res, httpStatus.OK, false, 'users', {
      users: transformedUsers,
      pagination: paginationResult.pagination,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    // if (req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }

    const user = await models.userModel.findById(id);
    if (!user) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'user not found');
    }
    const { userImage } = req.files;
    const { ...otherFields } = req.body;
    let images = {};
    if (Object.keys(req.files).length != 0) {
      images = {
        name: userImage[0].originalname,
        fileName: userImage[0].filename,
        path: '/cdn/uploads/images/' + userImage[0].filename,
        uploadedDate: new Date(),
      };
    }

    const updatedUser = await models.userModel
      .findByIdAndUpdate(
        id,
        {
          ...otherFields,
          userImage: req.files.userImage ? images : user.userImage,
        },
        { new: true }
      )
      .select(
        '_id firstName lastName email userImage contactNo isdCode country designation roleId systemAccess type'
      );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      user.roleId != req.body.roleId
        ? 'user role updated successfully'
        : 'user updated successfully',
      { updatedUser: updatedUser }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    // if (req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }

    const user = await models.userModel.findById(id);
    if (!user) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'user not found');
    }
    await models.userModel.findByIdAndDelete(id);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'User deleted successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function enableOrDisableSystemAccess(req, res, next) {
  try {
    const { userId } = req.params;
    const { systemAccess } = req.body;
    // if (req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }

    const user = await models.userModel.findById(userId);

    if (!user) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'User not found');
    }

    const updatedUser = await models.userModel
      .findByIdAndUpdate(userId, { $set: { systemAccess } }, { new: true })
      .select('firstName lastName userImage systemAccess');

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'User system access status updated successfully',
      { user: updatedUser }
    );
  } catch (error) {
    return next(new Error(error));
  }
}
