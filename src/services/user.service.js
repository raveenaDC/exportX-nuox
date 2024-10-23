import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import { sendMail } from '../utils/mail.helper.js';
import { createAccountTemplate } from '../registry/mail-templates/create-account.template.js';
import { generateRandomPassword } from '../utils/generate-random-password.helper.js';
import { generatePasswordHash } from '../utils/encryption.helper.js';
import { paginateData } from '../utils/paginate-data.js';
import { uppercaseFirstLetter } from '../utils/letter-case-change.helper.js';
const defaultPageLimit = process.env.PAGE_LIMIT;
let defaultRole = 'all';

export async function create(req, res, next) {
  try {
    const { firstName, lastName, email, designation, role, project } = req.body;
    const response = [];
    const errors = [];

    const clientExists = await models.clientModel.findOne({ email });
    if (clientExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'The email is already in use. Please select another one.'
      );
    }

    const emailExists = await models.userModel.findOne({ email });
    if (emailExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'email already  exists'
      );
    }

    const roleName = await models.roleModel.findById(role);
    if (roleName.roleName === 'client' || roleName.roleName === 'client user') {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        `can not create a user as '${roleName.roleName}'`
      );
    }

    const roleExits = await models.roleModel.findOne({
      _id: role,
      isActive: true,
    });
    if (!roleExits) {
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

    // const selectedProjects = [];

    // if (project) {
    //   for (const projectId of project) {
    //     if (selectedProjects.includes(projectId)) {
    //       errors.push({
    //         projectId,
    //         status: httpStatus.BAD_REQUEST,
    //         error: true,
    //         message: 'Duplicate project selection',
    //       });
    //     } else {
    //       selectedProjects.push(projectId);

    //       const projectData = await models.projectModel.findById(projectId);

    //       if (!projectData) {
    //         errors.push({
    //           projectId,
    //           status: httpStatus.NOT_FOUND,
    //           error: true,
    //           message: 'Project not found',
    //         });
    //       }
    //     }
    //   }

    //   if (errors.length > 0) {
    //     console.error('Errors:', errors);
    //     return responseHelper(
    //       res,
    //       httpStatus.BAD_REQUEST,
    //       true,
    //       'Some projects not found or duplicate project selection',
    //       { errors }
    //     );
    //   }
    // }

    const formattedFirstName = await uppercaseFirstLetter(firstName);
    const formattedLastName = await uppercaseFirstLetter(lastName);

    const password = generateRandomPassword();

    const user = await models.userModel.create({
      firstName: formattedFirstName,
      lastName: formattedLastName,
      email,
      designation,
      // projectId: project,
      roleId: role,
      password: await generatePasswordHash(password),
    });

    // for (const projectId of project) {
    //   const projectData = await models.projectModel.findById(projectId);
    //   if (projectData) {
    //     projectData.projectCoordinators.push(user.id);
    //     await projectData.save();
    //     response.push(projectId);
    //   }
    // }

    const selectedUser = await models.userModel
      .findById(user._id)
      .select(
        '_id firstName lastName email userImage designation type systemAccess projectId roleId'
      );
    const frontendUrl = process.env.FRONTEND_URL + '/auth/login';
    const subject = 'Account created successfully';
    const content = createAccountTemplate(
      firstName,
      email,
      password,
      frontendUrl
    );
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
    console.log(error);
    return next(new Error(error));
  }
}

export async function findAll(req, res, next) {
  try {
    let { pageLimit, orderBy, search, order, role, page } = req.query;

    pageLimit = parseInt(pageLimit || defaultPageLimit);
    page = parseInt(page || 1);
    order = order === 'asc' ? 1 : -1;
    let sort = { createdAt: order };
    sort = orderBy === 'name' ? { firstName: order } : sort;
    sort = orderBy === 'designation' ? { designation: order } : sort;

    // Construct query for search
    const query = {
      $or: [
        { email: { $regex: new RegExp(search, 'i') } },
        { firstName: { $regex: new RegExp(search, 'i') } },
        { lastName: { $regex: new RegExp(search, 'i') } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: new RegExp(search, 'i'),
            },
          },
        },
      ],
    };

    // Find matching designations based on search
    const matchedDesignations = await models.userDesignationModel.find({
      designation: { $regex: new RegExp(search, 'i') },
    });
    const designationIds = matchedDesignations.map(
      (designation) => designation._id
    );
    if (designationIds.length > 0) {
      query.$or.push({ designation: { $in: designationIds } });
    }

    // Find matching roles based on search
    const rolesId = role ? role.split('$') : [];
    if (rolesId.length > 0) {
      query.roleId = { $in: rolesId };
    }

    // Find users based on search and query
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
      .collation({ locale: 'en', strength: 2 })
      .sort(sort);
    users = users.filter((user) => user.roleId.roleName !== 'admin');

    if (search) {
      // Define a function to calculate relevance score
      const calculateRelevance = (user) => {
        const fields = [
          'firstName',
          'lastName',
          'email',
          'designation.designation',
        ];
        let relevance = 0;
        fields.forEach((field) => {
          if (
            user[field] &&
            user[field].toLowerCase().startsWith(search.toLowerCase())
          ) {
            relevance++;
          }
        });
        return relevance;
      };
      users.sort((a, b) => calculateRelevance(b) - calculateRelevance(a));
    }

    if (orderBy === 'designation') {
      users.sort((a, b) => {
        if (a.designation && b.designation) {
          return order === 1
            ? a.designation.designation.localeCompare(b.designation.designation)
            : b.designation.designation.localeCompare(
                a.designation.designation
              );
        }
        return 0;
      });
    }

    // Apply pagination after search
    const paginationResult = paginateData(users, page, pageLimit);
    paginationResult.pagination.orderBy = orderBy;
    paginationResult.pagination.order = order;
    let result = paginationResult.data;

    // Transform user data and return response
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

export async function viewProfile(req, res, next) {
  try {
    const { userId, clientId, clientUserId } = req.user;
    let profile;
    if (userId) {
      profile = await models.userModel
        .findById(userId)
        .select(
          '_id firstName lastName userImage designation email isdCode contactNo country'
        );
    } else if (clientId) {
      let client = await models.clientModel
        .findById(clientId)
        .select(
          '_id firstName lastName clientImage email primaryIsdCode primaryContactNo country'
        );
      const userImage = client.clientImage;
      profile = {
        _id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        userImage,
        designation: '',
        contactNo: client.primaryContactNo,
        isdCode: client.primaryIsdCode,
        country: client.country,
      };
    } else {
      let clientUser = await models.clientUserModel
        .findById(clientUserId)
        .select(
          '_id clientUserName clientUserEmail clientUserImage contactNo country isdCode'
        );
      const [firstName, lastName] = clientUser.clientUserName.split(' ');
      const email = clientUser.clientUserEmail;
      const userImage = clientUser.clientUserImage;
      const _id = clientUser._id;
      const contactNo = clientUser.contactNo;
      const country = clientUser.country;
      const isdCode = clientUser.isdCode;
      profile = {
        _id,
        firstName,
        lastName,
        email,
        userImage,
        designation: '',
        contactNo,
        country,
        isdCode,
      };
    }

    if (!profile) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'User not found',
        {}
      );
    }
    let post;
    if (profile.designation) {
      post = await models.userDesignationModel
        .findById(profile.designation)
        .select('designation');
    }
    if (userId) profile = { ...profile.toObject(), designation: post };
    else profile = profile = { ...profile };
    return responseHelper(res, httpStatus.OK, false, '', { profile });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { userId, clientId, clientUserId } = req.user;
    const {
      firstName,
      lastName,
      email,
      designation,
      contactNo,
      isdCode,
      country,
    } = req.body;
    let post = await models.userDesignationModel
      .findById(designation)
      .select('_id designation');
    let user;
    if (userId) {
      user = await models.userModel.findById(userId);
    } else if (clientId) {
      user = await models.clientModel.findById(clientId);
    } else {
      user = await models.clientUserModel.findById(clientUserId);
    }
    let userEmail = await models.userModel.findOne({
      email: email,
      _id: { $ne: user._id },
    });
    let clientUserEmail, userEmailexist;
    if (userId) {
      userEmailexist = await models.clientUserModel.findOne({
        clientUserEmail: email,
      });
    }
    if (clientUserId) {
      clientUserEmail = await models.clientUserModel.findOne({
        clientUserEmail: email,
        _id: { $ne: user._id },
      });
    }
    if (clientId) {
      clientUserEmail = await models.clientUserModel.findOne({
        clientUserEmail: email,
        roleId: { $ne: user.roleId },
      });
    }

    if (clientUserEmail || userEmail || userEmailexist) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `the email ${email} already exists`
      );
    }
    const { userImage } = req.files;
    let images = {};
    if (Object.keys(req.files).length != 0) {
      images = {
        name: userImage[0].originalname,
        fileName: userImage[0].filename,
        path: '/cdn/uploads/images/' + userImage[0].filename,
        uploadedDate: new Date(),
      };
    }
    const updatedFirstName = firstName
      ? await uppercaseFirstLetter(firstName)
      : user.firstName;
    const updatedLastName = lastName
      ? await uppercaseFirstLetter(lastName)
      : user.lastName;
    let updatedUser, clientUserTable;
    if (userId) {
      updatedUser = await models.userModel
        .findByIdAndUpdate(
          userId,
          {
            firstName: updatedFirstName,
            lastName: updatedLastName,
            designation: designation,
            email: email,
            isdCode: isdCode,
            contactNo: contactNo,
            country: country,
            userImage: req.files.userImage ? images : user.userImage,
          },
          { new: true }
        )
        .select(
          '_id firstName lastName email userImage contactNo isdCode country designation roleId systemAccess type'
        );
    } else if (clientId) {
      updatedUser = await models.clientModel.findByIdAndUpdate(
        clientId,
        {
          firstName: updatedFirstName,
          lastName: updatedLastName,
          // designation: designation,
          primaryIsdCode: isdCode,
          email: email,
          primaryContactNo: contactNo,
          country: country,
          clientImage: req.files.userImage ? images : user.clientImage,
        },
        { new: true }
      );
      clientUserTable = await models.clientUserModel.findOneAndUpdate(
        { clientId: clientId, roleId: updatedUser.roleId },
        {
          clientUserName: `${updatedFirstName} ${updatedLastName}`,
          clientUserEmail: email,
          clientUserImage: req.files.userImage ? images : user.clientUserImage,
        }
      );
    } else {
      updatedUser = await models.clientUserModel.findByIdAndUpdate(
        clientUserId,
        {
          clientUserName: `${updatedFirstName} ${updatedLastName}`,
          clientUserEmail: email,
          clientUserImage: req.files.userImage ? images : user.clientUserImage,
          contactNo: contactNo,
          isdCode: isdCode,
          country: country,
        },
        { new: true }
      );
    }

    if (clientId) {
      await clientUserTable.save();
    }
    await updatedUser.save();
    let image;
    if (userId) {
      image = req.files.userImage ? images : user.userImage;
    } else if (clientId) {
      image = req.files.userImage ? images : user.clientImage;
    } else {
      image = req.files.userImage ? images : user.clientUserImage;
    }
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Profile updated successfully',
      {
        profile: {
          firstName: updatedFirstName,
          lastName: updatedLastName,
          designation: post ? post : '',
          email: email,
          isdCode: isdCode,
          contactNo: contactNo,
          country: country,
          userImage: image,
        },
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function findOne(req, res, next) {
  try {
    const { id } = req.params;
    const userId = await models.userModel.findById(id);
    if (!userId) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'User not found',
        {}
      );
    }
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

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const user = await models.userModel.findById(id);
    if (!user) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'user not found');
    }
    const { firstName, lastName, roleId, ...otherFields } = req.body;
    const { userImage } = req.files;
    let images = {};
    if (Object.keys(req.files).length != 0) {
      images = {
        name: userImage[0].originalname,
        fileName: userImage[0].filename,
        path: '/cdn/uploads/images/' + userImage[0].filename,
        uploadedDate: new Date(),
      };
    }
    const updatedFirstName = firstName
      ? await uppercaseFirstLetter(firstName)
      : user.firstName;
    const updatedLastName = lastName
      ? await uppercaseFirstLetter(lastName)
      : user.lastName;

    const updatedUser = await models.userModel
      .findByIdAndUpdate(
        id,
        {
          firstName: updatedFirstName,
          lastName: updatedLastName,
          ...otherFields,
          userImage: req.files.userImage ? images : user.userImage,
        },
        { new: true }
      )
      .select(
        '_id firstName lastName email userImage contactNo isdCode country designation roleId systemAccess type'
      );
    if (roleId && roleId !== user.roleId) {
      const role = await models.roleModel.findById(roleId);
      if (role.roleName === 'client' || role.roleName === 'client user') {
        return responseHelper(
          res,
          httpStatus.BAD_REQUEST,
          true,
          `can not update a user as '${role.roleName}'`
        );
      }
      updatedUser.roleId = roleId;
      var message = `Successfully updated user role to ${role?.roleName}`;
    } else {
      var message = 'Profile updated successfully';
    }
    await updatedUser.save();

    return responseHelper(res, httpStatus.OK, false, message, {
      updatedUser: updatedUser,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function userImageRemove(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await models.userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.userImage = {
      path: '/cdn/images/user.png',
      uploadedDate: new Date(),
    };

    await user.save();

    return res
      .status(200)
      .json({ message: 'profile image is removed successfully' });
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
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

//For admin/project manager
export async function enableOrDisableSystemAccess(req, res, next) {
  try {
    const { userId } = req.params;
    const { systemAccess } = req.body;
    console.log(systemAccess);
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
      `system access has been ${
        systemAccess ? 'enabled' : 'disabled'
      } successfully`,
      { user: updatedUser }
    );
  } catch (error) {
    return next(new Error(error));
  }
}
