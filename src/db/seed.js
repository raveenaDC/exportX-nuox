import mongodb from './mongo-db.js';
import * as models from './models/index.js';
import { generatePasswordHash } from '../utils/encryption.helper.js';
import { seedData } from './seed-data.js';
/**
 * run database seeding operations.
 */
async function seeder() {
  // //create connection
  await mongodb.createConnection();
  //insert ad goals
  //..await models.adGoalModel.insertMany(seedData.adGoals);
  //..const roles = await models.roleModel.insertMany(seedData.roles);
  //  add permissions for roles
  //by default every role has all permissions
  //.... await models.permissionModel.deleteMany({});
  // for (let role of roles) {
  //   await models.permissionModel.create({
  //     role: role._id,
  //     permissions: seedData.defaultPermissions,
  //   });
  //.... }
  // ...  await models.userDesignationModel.insertMany(seedData.designations);
  //   //insert tone of voices
  //   await models.toneOfVoiceModel.insertMany(seedData.toneOfVoices);
  //   const post = await models.userDesignationModel.findOne({
  //     designation: 'admin',
  //   });
  //   const role = await models.roleModel.findOne({ roleName: 'admin' });
  //   //create admin user
  //   await models.userModel.create({
  //     firstName: 'admin',
  //     lastName: 'admin',
  //     email: 'admin@nuox.com',
  //     designation: post._id,
  //     password: await generatePasswordHash('element8'),
  //     type: 'internal',
  //     roleId: role._id,
  //     systemAccess: true,
  //   });
  //   await models.promptModel.deleteMany({});
  //   // //basic prompts
  //...   await models.promptModel.insertMany(seedData.prompts);
}
seeder()
  .then(async () => {
    console.log('mongo db seeding completed ..!!');
    await mongodb.closeConnection();
    process.exit(0);
  })
  .catch(async (error) => {
    console.log('error seeding database :', error.message);
    await mongodb.closeConnection();
    process.exit(0);
  });
