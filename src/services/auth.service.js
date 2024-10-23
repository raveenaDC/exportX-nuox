import httpStatus from 'http-status';
import * as models from '../db/models/index.js';
import { responseHelper } from '../utils/response.helper.js';
import {
  comparePassword,
  generateJwtToken,
  generatePasswordHash,
  verifyJwtToken,
} from '../utils/encryption.helper.js';
import { sendMail } from '../utils/mail.helper.js';
import { resetPasswordTemplate } from '../registry/mail-templates/reset-password.template.js';
import { verifyGoogleToken } from '../utils/verify-google-token.js';
import { accountBlockedTemplate } from '../registry/mail-templates/account-blocked.template.js';
import { findUserRoleAndDesignation } from '../utils/db-helper/find-user-role-and-designation.js';
import { generateAndSaveAccessToken } from '../utils/db-helper/generate-and-save-access-token.js';
const LOGIN_ATTEMPT_LIMIT = process.env.LOGIN_ATTEMPT_LIMIT;

/**
 * @body {String} email
 * @body {String} password
 * @returns {Object} userDetail
 * @returns {Object} accessToken
 */

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const userCheck = await models.userModel.findOne({ email });
    const clientUserCheck = await models.clientUserModel.findOne({
      clientUserEmail: email,
    });

    if (!userCheck && !clientUserCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'email is not found'
      );
    }
    let userType;
    if (userCheck) {
      userType = 'internal';
      const passwordCompare = await comparePassword(
        password,
        userCheck.password
      );

      if (!passwordCompare) {
        return responseHelper(
          res,
          httpStatus.UNAUTHORIZED,
          true,
          'Invalid credentials'
        );
      }
      if (!userCheck.systemAccess) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'You have no access to the system.Please contact the administrator'
        );
      }
      const { role, designation } = await findUserRoleAndDesignation(
        userCheck.roleId,
        userCheck.designation
      );
      const accessToken = await generateAndSaveAccessToken(
        'user',
        userCheck._id,
        role?.roleName
      );
      const permissions = await models.permissionModel.findOne({
        role: role?._id,
      });
      //   let userPermission = (permissions?.permissions || []).map((permission) => {
      //     if (permission.accessToAllControls) {
      //         return permission;
      //     }
      //     return null;
      // }).filter(permission => permission !== null);

      const userDetails = {
        firstName: userCheck.firstName,
        lastName: userCheck.lastName,
        userImage: userCheck.userImage,
        email: userCheck.email,
        contactNo: userCheck.contactNo,
        isdCode: userCheck.isdCode,
        profile: userCheck.userImage,
        country: userCheck.country,
        designation: designation?.designation,
        role: role?.roleName,
        systemAccess: userCheck.systemAccess,
        type: userCheck.type,
        permissions: permissions?.permissions,
        //permissions: userPermission,
      };
      return responseHelper(res, httpStatus.OK, false, 'Login successfully', {
        userDetails: userDetails,
        accessToken: accessToken,
        userType: userType,
      });
    }
    let nameParts, clientName;
    if (clientUserCheck) {
      clientName = clientUserCheck.clientUserName;
      nameParts = clientName.split(' ');
      userType = 'external';
      const passwordCompare = await comparePassword(
        password,
        clientUserCheck.password
      );

      if (!passwordCompare) {
        return responseHelper(
          res,
          httpStatus.UNAUTHORIZED,
          true,
          'Invalid credentials'
        );
      }

      const { role, designation } = await findUserRoleAndDesignation(
        clientUserCheck.roleId,
        null
      );
      //generate access token based on client id
      let client, clientRole;
      if (role.roleName == 'client user') {
        client = await models.clientUserModel.findOne({
          clientUserEmail: email,
        });
        clientRole = 'client user';
      } else if (role.roleName == 'client') {
        client = await models.clientModel.findOne({ email });
        if (!client.systemAccess) {
          return responseHelper(
            res,
            httpStatus.CONFLICT,
            true,
            'You have no access to the system.Please contact the administrator'
          );
        }
        clientRole = 'client';
      }
      const accessToken = await generateAndSaveAccessToken(
        clientRole,
        client._id,
        role?.roleName
      );
      const permissions = await models.permissionModel.findOne({
        role: role?._id,
      });

      const userDetails = {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        // name: clientUserCheck.clientUserName,
        userImage: clientUserCheck.clientUserImage,
        profile: clientUserCheck.clientUserImage,
        email: clientUserCheck.clientUserEmail,
        role: role?.roleName,
        permissions: permissions?.permissions,
      };
      return responseHelper(res, httpStatus.OK, false, 'Login successful', {
        userDetails: userDetails,
        accessToken: accessToken,
        userType: userType,
      });
    }
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * using token to logout user
 * @returns {Null}
 */
export async function logout(req, res, next) {
  try {
    const { token } = req;
    await models.tokenModel.findOneAndUpdate(
      {
        token,
        active: true,
      },
      { active: false }
    );

    return responseHelper(res, httpStatus.OK, true, 'Logout successful', {});
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} oldPassword
 * @body {String} newPassword
 * @returns {Null}
 */
export async function updatePassword(req, res, next) {
  try {
    let { userId, clientId, clientUserId } = req.user;
    const { oldPassword, newPassword } = req.body;
    if (oldPassword === newPassword) {
      return responseHelper(
        res,
        httpStatus.UNPROCESSABLE_ENTITY,
        true,
        'new password should not be same as old password'
      );
    }

    if (userId) {
      //current user is internal
      const user = await models.userModel.findById(userId);
      const passwordCheck = await comparePassword(oldPassword, user.password);

      if (!passwordCheck) {
        return responseHelper(
          res,
          httpStatus.UNPROCESSABLE_ENTITY,
          true,
          'wrong old password'
        );
      }
      //update password
      const passwordHash = await generatePasswordHash(newPassword);
      await models.userModel.findOneAndUpdate(
        { _id: userId },
        { password: passwordHash }
      );

      await models.tokenModel.updateMany(
        { userId, tokenType: 'authentication', active: true },
        { active: false }
      );

      //revoke access token
      await models.tokenModel.updateMany(
        { userId, tokenType: 'authentication', active: true },
        { active: false }
      );
    }

    if (clientId) {
      //current user is external
      const client = await models.clientModel.findById(clientId);
      const clientUser = await models.clientUserModel.findOne({
        clientUserEmail: client?.email,
      });
      const passwordCheck = await comparePassword(
        oldPassword,
        clientUser?.password
      );

      if (!passwordCheck) {
        return responseHelper(
          res,
          httpStatus.UNPROCESSABLE_ENTITY,
          true,
          'wrong old password'
        );
      }

      //update password
      const passwordHash = await generatePasswordHash(newPassword);
      clientUser.password = passwordHash;
      client.password = passwordHash;
      await client.save();
      await clientUser.save();

      //revoke token access
      const activeToken = await models.tokenModel.updateMany(
        { userId: clientId, tokenType: 'authentication', active: true },
        { active: false }
      );
    }
    if (clientUserId) {
      //current user is external
      const clientUser = await models.clientUserModel.findById(clientUserId);
      const passwordCheck = await comparePassword(
        oldPassword,
        clientUser?.password
      );

      if (!passwordCheck) {
        return responseHelper(
          res,
          httpStatus.UNPROCESSABLE_ENTITY,
          true,
          'wrong old password'
        );
      }

      //update password
      const passwordHash = await generatePasswordHash(newPassword);
      clientUser.password = passwordHash;
      await clientUser.save();

      //revoke token access
      const activeToken = await models.tokenModel.updateMany(
        { userId: clientUserId, tokenType: 'authentication', active: true },
        { active: false }
      );
    }

    return responseHelper(
      res,
      httpStatus.OK,
      true,
      'password updated successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} email
 * @returns {Null}
 */
export async function sendForgotPasswordMail(req, res, next) {
  try {
    const { email } = req.params;
    const user = await models.userModel.findOne({
      email,
    });
    const clientUser = await models.clientUserModel.findOne({
      clientUserEmail: email,
    });
    const { role, designation } = await findUserRoleAndDesignation(
      clientUser.roleId,
      null
    );
    let clientDataId, clientData;
    if (role.roleName != 'client user') {
      clientData = await models.clientModel.findOne({ email });
      clientDataId = clientData._id;
    }
    if (!user && !clientUser) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'email not found');
    }
    let userId;
    switch (role.roleName) {
      case 'client user':
        userId = clientUser?._id;
        break;
      case 'client':
        userId = clientDataId;
        break;
      default:
        userId = user?._id;
        break;
    }
    await models.tokenModel.updateMany(
      {
        userId: userId,
        tokenType: 'reset-password',
      },
      { $set: { active: false } }
    );
    let token;
    if (role.roleName === 'client user') {
      token = await generateJwtToken({
        clientUserId: userId,
        role: role.roleName,
      });
    }
    if (role.roleName === 'client') {
      token = await generateJwtToken({
        clientId: userId,
        role: role.roleName,
      });
    } else {
      token = await generateJwtToken({
        userId: userId,
        role: role.roleName,
      });
    }
    await models.tokenModel.create({
      userId: userId,
      token: token,
      tokenType: 'reset-password',
    });

    //send mail
    const subject = 'Forgot password ?';
    const frontendUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const template = resetPasswordTemplate(
      user?.firstName || clientUser?.clientUserName,
      frontendUrl
    );

    await sendMail(email, subject, template);

    return responseHelper(
      res,
      httpStatus.OK,
      true,
      'please check your mail for reset password instructions.'
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

/**
 * @body {String} password
 * @body {String} token
 * @returns {Null}
 */
export async function resetPassword(req, res, next) {
  try {
    const { password, token } = req.body;
    const tokenData = await models.tokenModel.findOne({
      token,
      tokenType: 'reset-password',
      active: true,
    });
    if (!tokenData) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'this password reset link is invalid'
      );
    }
    const tokenVerificationResult = verifyJwtToken(tokenData.token);
    if (!tokenVerificationResult.validToken) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'this password reset link is invalid'
      );
    }
    // verify link expiry (2 minutes)
    const currentTime = new Date();
    const differenceInMs = currentTime - tokenData.createdAt;
    const differenceInMinutes = differenceInMs / (1000 * 60);
    const EXPIRY_MINUTES = 5;

    if (differenceInMinutes > EXPIRY_MINUTES) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'this password reset link is expired'
      );
    }

    const passwordHash = await generatePasswordHash(password);
    //update password
    const userType = tokenVerificationResult.data?.role;

    if (userType === 'client user') {
      await models.clientUserModel.findOneAndUpdate(
        { _id: tokenData.userId },
        { password: passwordHash }
      );
    } else if (userType === 'client') {
      const client = await models.clientModel.findOneAndUpdate(
        { _id: tokenData.userId },
        { password: passwordHash }
      );
      await models.clientUserModel.findOneAndUpdate(
        { clientUserEmail: client.email },
        { password: passwordHash }
      );
    } else {
      await models.userModel.findOneAndUpdate(
        { _id: tokenData.userId },
        { password: passwordHash }
      );
    }

    //revoke old token
    await models.tokenModel.findOneAndUpdate(
      {
        token,
        tokenType: 'reset-password',
        active: true,
      },
      { active: false }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      true,
      'password reset completed. login to continue.'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

//google login call back
export async function loginWithGoogle(req, res, next) {
  try {
    //token from frontend after successful google login
    const { token } = req.body;
    if (!token)
      return responseHelper(
        res,
        httpStatus.UNAUTHORIZED,
        true,
        'token is required'
      );

    const tokenVerificationResult = await verifyGoogleToken(token);
    if (tokenVerificationResult.isError)
      return responseHelper(
        res,
        httpStatus.UNAUTHORIZED,
        true,
        tokenVerificationResult.message
      );
    const { email } = tokenVerificationResult.data;

    //check if the user in database or not
    const userExists = await models.userModel
      .findOne({ email: email })
      .populate('designation')
      .populate('roleId');

    const clientUserExists = await models.clientUserModel
      .findOne({ clientUserEmail: email })
      .populate('roleId');

    if (!userExists && !clientUserExists) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'user not exists');
    }
    if (userExists && !userExists.systemAccess) {
      return responseHelper(
        res,
        httpStatus.UNAUTHORIZED,
        true,
        'You have no access to the system. contact your administrator'
      );
    }

    //find client details
    let client, userRole;
    if (clientUserExists && clientUserExists.roleId?.roleName === 'client') {
      client = await models.clientModel.findOne({ email });
      if (!client.systemAccess) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'You have no access to the system.Please contact the administrator'
        );
      }
      userRole = 'client';
    } else if (
      clientUserExists &&
      clientUserExists.roleId?.roleName === 'client user'
    ) {
      client = await models.clientUserModel.findOne({ clientUserEmail: email });
      userRole = 'client user';
    }
    let userId = userExists
      ? userExists._id
      : clientUserExists
        ? client._id
        : clientUserExists._id;

    const accessToken = await generateAndSaveAccessToken(
      userExists ? 'user' : userRole,
      userId,
      userExists
        ? userExists?.roleId.roleName
        : clientUserExists?.roleId.roleName
    );

    let userDetails;
    if (userExists) {
      const userPost = await models.userDesignationModel.findById(
        userExists.designation
      );
      const permissions = await models.permissionModel.findOne({
        role: userExists?.roleId,
      });

      userDetails = {
        firstName: userExists.firstName,
        lastName: userExists.lastName,
        email: userExists.email,
        contactNo: userExists.contactNo,
        isdCode: userExists.isdCode,
        profile: userExists.userImage,
        country: userExists.country,
        designation: userPost?.designation,
        roleId: userExists?.roleId.roleName,
        systemAccess: userExists.systemAccess,
        type: userExists.type,
        permissions: permissions?.permissions,
      };
    }
    let nameParts, clientName;
    if (clientUserExists) {
      clientName = clientUserExists.clientUserName;
      nameParts = clientName.split(' ');
      const permissions = await models.permissionModel.findOne({
        role: clientUserExists?.roleId,
      });
      userDetails = {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        // name: clientUserExists.clientUserName,
        userImage: clientUserExists.clientUserImage,
        profile: clientUserExists.clientUserImage,
        email: clientUserExists.clientUserEmail,
        role: clientUserExists?.roleId.roleName,
        permissions: permissions?.permissions,
      };
    }

    return responseHelper(res, httpStatus.OK, false, 'Logged in successfully', {
      userDetails,
      accessToken: accessToken,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
