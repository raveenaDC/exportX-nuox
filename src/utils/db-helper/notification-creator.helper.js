import * as models from '../../db/models/index.js';
export async function getUserName(userId) {
  try {
    let userName;
    let user = await models.userModel.findById(userId);
    return (userName = user.firstName + ' ' + user.lastName);
  } catch (error) {
    throw error;
  }
}
export async function getClientName(clientId) {
  try {
    let userName;
    let client = await models.clientModel.findById(clientId);
    return (userName = client.firstName + ' ' + client.lastName);
  } catch (error) {
    throw error;
  }
}
export async function getClientUserName(clientUserId) {
  try {
    let userName;
    let clientUser = await models.clientUserModel.findById(clientUserId);
    return (userName = clientUser.clientUserName);
  } catch (error) {
    throw error;
  }
}

export async function sendNotificationsForRole(
  roleName,
  creatorId,
  notificationContent
) {
  try {
    const role = await models.roleModel.findOne({ roleName });
    if (role) {
      const users = await models.userModel.find({ roleId: role._id });
      if (users.length > 0) {
        await Promise.all(
          users.map(async (user) => {
            await models.notificationModel.create({
              content: notificationContent,
              createdByUser: creatorId,
              createdForUser: user._id,
            });
          })
        );
      }
    }
  } catch (error) {
    throw error;
  }
}
export async function sendClientNotificationsForRole(
  roleName,
  creatorId,
  notificationContent
) {
  try {
    const role = await models.roleModel.findOne({ roleName });
    if (role) {
      const users = await models.userModel.find({ roleId: role._id });
      if (users.length > 0) {
        await Promise.all(
          users.map(async (user) => {
            await models.notificationModel.create({
              content: notificationContent,
              createdByClient: creatorId,
              createdForUser: user._id,
            });
          })
        );
      }
    }
  } catch (error) {
    throw error;
  }
}
export async function sendClientUserNotificationsForRole(
  roleName,
  creatorId,
  notificationContent
) {
  try {
    const role = await models.roleModel.findOne({ roleName });
    if (role) {
      const users = await models.userModel.find({ roleId: role._id });
      if (users.length > 0) {
        await Promise.all(
          users.map(async (user) => {
            await models.notificationModel.create({
              content: notificationContent,
              createdByClientUser: creatorId,
              createdForUser: user._id,
            });
          })
        );
      }
    }
  } catch (error) {
    throw error;
  }
}
