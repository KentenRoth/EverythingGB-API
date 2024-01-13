const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecipeSchema = new Schema({
	title: {
		type: String,
		required: true,
		trim: true,
	},
	ingredients: {
		type: [String],
		required: true,
		trim: true,
	},
	ingredientsSetTwo: {
		type: [String],
		required: false,
		trim: true,
	},
	instructions: {
		type: String,
		required: true,
		trim: true,
	},
	category: {
		type: String,
		required: true,
		trim: true,
	},
	notes: {
		type: String,
		required: false,
		trim: true,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
});

module.exports = mongoose.model('Recipe', RecipeSchema);
