const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
	bookmarks: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Recipe',
		},
	],
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
		user.password = await bcrypt.hash(user.password, 8);
	}
	next();
});

UserSchema.methods.getSafeUser = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;

	return userObject;
};

UserSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error('Please check login information');
	}

	const isMatch = await bcrypt.compare(password, user.password);

	if (!isMatch) {
		throw new Error('Please check login information');
	}

	return user;
};

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
