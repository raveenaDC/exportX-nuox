  import { Schema, model } from 'mongoose';

  const promptSchema = new Schema(
    {
      name: {
        type: String,
      },
      key: {
        type: String,
        unique: true,
      },
      information: {
        type: String,
      },
      params: {
        type: String,
      },
      instruction: {
        type: String,
      },
      active: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

  //1
  promptSchema.pre('validate', function (next) {
    this.key = this.key || this.name.toLowerCase().split(' ').join('_');

    console.log(this.key);
    next();
  });
  export default model('prompt', promptSchema);
