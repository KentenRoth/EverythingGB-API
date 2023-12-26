const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcryupt = require('bcryptjs');
const validator = require('validator');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
		validate(value) {
			if (!validator.isEmail(value)) {
				throw new Error('Email is invalid');
			}
		},
	},
	role: {
		type: String,
		default: 'user',
	},
	password: {
		type: String,
		required: true,
		minlength: 7,
		trim: true,
	},
	tokens: [
		{
			token: {
				type: String,
				required: true,
			},
		},
	],
});

UserSchema.pre('save', async function (next) {
	const user = this;
	if (user.isModified('password')) {
		user.password = await bcryupt.hash(user.password, 8);
	}
	next();
});

UserSchema.methods.createAuthToken = async function () {
	const user = this;
	const token = jwt.sign(
		{ _id: user._id.toString() },
		process.env.HIDDEN_KEY
	);
	user.tokens = user.tokens.concat({ token });
	await user.save();
	return token;
};

module.exports = User = mongoose.model('User', UserSchema);
