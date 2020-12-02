import mongoose from 'mongoose';

const accountSchema = mongoose.Schema({
  agencia: {
    type: Number,
    required: true,
  },
  conta: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    min: 0,
    required: true,
    validate(value) {
      if (value < 0) throw new Error('Valor negativo para nota');
    },
  },
  lastModified: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const accountModel = mongoose.model('Account', accountSchema);

export { accountModel };
