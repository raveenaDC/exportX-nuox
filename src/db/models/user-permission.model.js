import { Schema, Types, model } from 'mongoose';

const userPermissionSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
    },
    clientId: {
      type: Types.ObjectId,
      ref: 'Client',
    },
    permissionId: {
      type: Types.ObjectId,
      ref: 'Permission',
    },
  },
  { timestamps: true }
);
export default model('UserPermission', userPermissionSchema);
