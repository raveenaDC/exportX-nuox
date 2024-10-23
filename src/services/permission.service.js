import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function getRoles(req, res, next) {
  try {
    const roles = await models.roleModel.find({});
    return responseHelper(res, httpStatus.OK, false, 'roles', {
      roles: roles,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function getRolesById(req, res, next) {
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
      RolePermissions: permission,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function createPermission(req, res, next) {
  try {
    const { roleId } = req.body;
    //check if permission has already added for this role
    const permissionCheck = await models.permissionModel.findOne({
      role: roleId,
    });
    if (permissionCheck) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'permission already added for this role'
      );
    }

    const permission = await models.permissionModel.create({
      role: roleId,
      permissions: [
        {
          name: 'client-dashboard',
          accessToAllControls: true,
          controls: [
            {
              name: 'view-dashboard',
              active: true,
            },
            {
              name: 'view-projects',
              active: true,
            },
            {
              name: 'view-project-overview',
              active: true,
            },
            {
              name: 'view-project-document-management',
              active: true,
            },
            {
              name: 'view-user-management',
              active: true,
            },
            {
              name: 'add-client-user',
              active: true,
            },
            {
              name: 'delete-client-user',
              active: true,
            },
            {
              name: 'make-client-coordinator',
              active: true,
            },
            {
              name: 'view-discussion-forum',
              active: true,
            },
            {
              name: 'create-discussion',
              active: true,
            },
            {
              name: 'delete-discussion',
              active: true,
            },
            {
              name: 'update-discussion',
              active: true,
            },
            {
              name: 'view-social-media-post',
              active: true,
            },
            {
              name: 'bulk-action',
              active: true,
            },
            {
              name: 'view-individual-post',
              active: true,
            },
            {
              name: 'reject-post',
              active: true,
            },
            {
              name: 'approve-post',
              active: true,
            },
            {
              name: 'rework-post',
              active: true,
            },
            {
              name: 'add-comments',
              active: true,
            },
            {
              name: 'delete-comments',
              active: true,
            },
          ],
        },
        {
          name: 'project-manager-dashboard',
          accessToAllControls: true,
        },
        {
          name: 'users',
          accessToAllControls: true,
          controls: [
            {
              name: 'create',
              active: true,
            },
            {
              name: 'update',
              active: true,
            },
            {
              name: 'view',
              active: true,
            },
            {
              name: 'delete',
              active: true,
            },
          ],
        },
        {
          name: 'clients',
          accessToAllControls: true,
          controls: [
            {
              name: 'create',
              active: true,
            },
            {
              name: 'update',
              active: true,
            },
            {
              name: 'view',
              active: true,
            },
            {
              name: 'delete',
              active: true,
            },
          ],
        },
        {
          name: 'projects',
          accessToAllControls: true,
          controls: [
            {
              name: 'create',
              active: true,
            },
            {
              name: 'update',
              active: true,
            },
            {
              name: 'view',
              active: true,
            },
            {
              name: 'delete',
              active: true,
            },
            {
              name: 'update-status',
              active: true,
            },
            {
              name: 'view-project',
              active: true,
            },
            {
              name: 'update-project-overview',
              active: true,
            },
            {
              name: 'rename-document',
              active: true,
            },
            {
              name: 'delete-document',
              active: true,
            },
            {
              name: 'save-document',
              active: true,
            },
            {
              name: 'add-client-user',
              active: true,
            },
            {
              name: 'remove-client-user',
              active: true,
            },
            {
              name: 'make-client-coordinator',
              active: true,
            },
            {
              name: 'add-project-coordinator',
              active: true,
            },
            {
              name: 'remove-project-coordinator',
              active: true,
            },
            {
              name: 'make-project-manager',
              active: true,
            },
            {
              name: 'view-tasks',
              active: true,
            },
            {
              name: 'create-tasks',
              active: true,
            },
            {
              name: 'update-task',
              active: true,
            },
            {
              name: 'delete-task',
              active: true,
            },
            {
              name: 'update-task-status',
              active: true,
            },
            {
              name: 'task-submit-for-approval',
              active: true,
            },
            {
              name: 'task-bulk-actions',
              active: true,
            },
            {
              name: 'view-discussion-forum',
              active: true,
            },
            {
              name: 'send-discussion-forum-message',
              active: true,
            },
            {
              name: 'edit-discussion-forum-message',
              active: true,
            },
            {
              name: 'delete-discussion-forum-message',
              active: true,
            },
            {
              name: 'generate-social-media-planner',
              active: true,
            },
          ],
        },
        {
          name: 'settings',
          accessToAllControls: true,
          controls: [
            {
              name: 'create-role',
              active: true,
            },
            {
              name: 'view-role',
              active: true,
            },
            {
              name: 'update-role',
              active: true,
            },
            {
              name: 'delete-role',
              active: true,
            },
            {
              name: 'create-designation',
              active: true,
            },
            {
              name: 'view-designation',
              active: true,
            },
            {
              name: 'update-designation',
              active: true,
            },
            {
              name: 'delete-designation',
              active: true,
            },
            {
              name: 'create-ad-goal',
              active: true,
            },
            {
              name: 'view-ad-goal',
              active: true,
            },
            {
              name: 'update-ad-goal',
              active: true,
            },
            {
              name: 'delete-ad-goal',
              active: true,
            },
            {
              name: 'create-tone-of-voice',
              active: true,
            },
            {
              name: 'view-tone-of-voice',
              active: true,
            },
            {
              name: 'update-tone-of-voice',
              active: true,
            },
            {
              name: 'delete-tone-of-voice',
              active: true,
            },
          ],
        },
        {
          name: 'tools',
          accessToAllControls: true,
          controls: [
            {
              name: 'generate-email-draft',
              active: true,
            },
            {
              name: 'view-email-draft',
              active: true,
            },
            {
              name: 'save-email-draft',
              active: true,
            },
            {
              name: 'generate-campaign-idea',
              active: true,
            },
            {
              name: 'view-campaign-idea',
              active: true,
            },
            {
              name: 'save-campaign-idea',
              active: true,
            },
            {
              name: 'generate-creative-idea',
              active: true,
            },
            {
              name: 'view-creative-idea',
              active: true,
            },
            {
              name: 'save-creative-idea',
              active: true,
            },
            {
              name: 'generate-single-post',
              active: true,
            },
          ],
        },
      ],
    });
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'new permission added successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getPermission(req, res, next) {
  try {
    const { permissionId } = req.params;
    const permissionCheck = await models.permissionModel.findById(permissionId);

    if (!permissionCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'permission not found'
      );
    }

    return responseHelper(res, httpStatus.OK, false, 'permission', {
      permission: permissionCheck,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function updatePermissionControlActiveStatus(req, res, next) {
  try {
    const { permissionId, parentId, controlId } = req.params;
    const { active } = req.body;
    // Find the permission document by its ID
    const permissionCheck = await models.permissionModel.findById(permissionId);
    if (!permissionCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Permission not found'
      );
    }

    // Find the index of the permission within the permissions array
    const permissionIndex = permissionCheck.permissions.findIndex(
      (perm) => perm._id.toString() === parentId
    );
    if (permissionIndex === -1) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Parent permission not found'
      );
    }

    // Find the index of the control within the controls array
    const controlIndex = permissionCheck.permissions[
      permissionIndex
    ].controls.findIndex((ctrl) => ctrl._id.toString() === controlId);
    if (controlIndex === -1) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Control not found'
      );
    }

    // Update the active status of the control
    permissionCheck.permissions[permissionIndex].controls[controlIndex].active =
      active;

    //modify permission parent accessToAllControls
    const controlIsFalse = permissionCheck.permissions[
      permissionIndex
    ].controls.find((control) => control.active === false);
    if (controlIsFalse) {
      permissionCheck.permissions[permissionIndex].accessToAllControls = false;
    }

    // Save the updated permission document
    await permissionCheck.save();

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Permission control status updated successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}
export async function updateAccessToAllControlsStatus(req, res, next) {
  try {
    const { permissionId, parentId } = req.params;
    const { active } = req.body;
    // Find the permission document by its ID
    const permissionCheck = await models.permissionModel.findById(permissionId);
    if (!permissionCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Permission not found'
      );
    }

    // Find the index of the permission within the permissions array
    const permissionIndex = permissionCheck.permissions.findIndex(
      (perm) => perm._id.toString() === parentId
    );
    if (permissionIndex === -1) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Parent permission not found'
      );
    }

    permissionCheck.permissions[permissionIndex].accessToAllControls = active;
    permissionCheck.permissions[permissionIndex].controls.forEach((control) => {
      control.active = active;
    });

    // Save the updated permission document
    await permissionCheck.save();

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'accessToAllControls status updated successfully'
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}
