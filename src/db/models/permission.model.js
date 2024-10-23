import { Schema, model } from 'mongoose';

const permissionSchema = new Schema(
  {
    role: { type: Schema.Types.ObjectId, ref: 'Role' },
    permissions: [
      {
        name: String,
        accessToAllControls: {
          type: Boolean,
        },
        controls: [
          {
            name: String,
            active: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default model('Permission', permissionSchema);
