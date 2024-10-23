import * as models from '../../db/models/index.js';
export async function findUserRoleAndDesignation(
  roleId = '',
  designationId = ''
) {
  const role = roleId ? await models.roleModel.findById(roleId) : null;
  const designation = designationId
    ? await models.userDesignationModel.findById(designationId)
    : null;
  return { role, designation };
}
