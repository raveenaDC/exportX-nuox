import mongoDb from './src/db/mongo-db.js';
import * as models from './src/db/models/index.js';
async function main() {
  try {
    await mongoDb.createConnection();
    console.log('running migration...');
    const clients = await models.clientModel.find();
    const clientRole = await models.roleModel.findOne({ roleName: 'client' });
    console.log(clients, clientRole);

    for (let client of clients) {
      console.log(
        `running migration for ${client.firstName} ${client.lastName}`
      );
      await models.clientUserModel.create({
        clientUserName: `${client.firstName} ${client.lastName}`,
        clientUserEmail: client.email,
        password: client.password,
        roleId: clientRole._id,
        clientId: client._id,
      });
    }
    console.log('migration completed successfully!!!');
  } catch (error) {
    console.log('error running migration', error);
  }
}

main();
