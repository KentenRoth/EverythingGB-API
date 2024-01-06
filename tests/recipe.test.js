const request = require('supertest');
const app = require('../server/app');
const User = require('../server/Models/User');
const Recipe = require('../server/Models/Recipe');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userOneId = new mongoose.Types.ObjectId();
const userOneToken = jwt.sign({ _id: userOneId }, process.env.HIDDEN_KEY);

const userOne = {
	_id: userOneId,
	name: 'testUser',
	email: 'testUser@test.com',
	password: 'test1234',
	role: 'user',
	tokens: [
		{
			token: userOneToken,
		},
	],
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwoToken = jwt.sign({ _id: userTwoId }, process.env.HIDDEN_KEY);
const userTwo = {
	_id: userTwoId,
	name: 'testAdmin',
	email: 'testAdmin@test.com',
	password: 'test1234',
	role: 'admin',
	tokens: [
		{
			token: userTwoToken,
		},
	],
};

describe('POST /recipes', () => {
	beforeAll(async () => {
		User.deleteMany();
		Recipe.deleteMany();
	});

	it('Should create a new recipe', async () => {
		await User.deleteMany();
		await Recipe.deleteMany();
		await new User(userOne).save();
		await new User(userTwo).save();
		await request(app)
			.post('/recipes')
			.set('Authorization', `Bearer ${userOneToken}`)
			.send({
				title: 'user test',
				ingredients: ['test'],
				instructions: 'bake at 400, wait 20 minutes, enjoy',
				category: ['snack', 'cookies'],
			})
			.expect(201);
		await request(app)
			.post('/recipes')
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send({
				title: 'admin test',
				ingredients: ['test'],
				instructions:
					'bake at 300 for 2 hours, stir ever 10 minutes, let rest 10 minutes',
				category: ['dinner', 'potatoes'],
			})
			.expect(201);
	});

	it('Should not create a new recipe if not logged in', async () => {
		await request(app)
			.post('/recipes')
			.send({
				title: 'test',
				ingredients: ['test'],
				instructions: 'test',
			})
			.expect(401);
	});
});

describe('GET /recipes', () => {
	it('should get recipes if user is admin', async () => {
		const response = await request(app)
			.get('/recipes')
			.set('Authorization', `Bearer ${userTwoToken}`)
			.send()
			.expect(200);
		expect(response.body.length).toEqual(2);
		expect(response.body[0].title).toEqual('user test');
		expect(response.body[1].title).toEqual('admin test');
	});

	it('should get recipes of user created recipies and not admin', async () => {
		const response = await request(app)
			.get('/recipes')
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(200);
		expect(response.body.length).toEqual(1);
		expect(response.body[0].title).toEqual('user test');
	});

	it('should not get recipes if not logged in', async () => {
		await request(app).get('/recipes').send().expect(401);
	});

	it('should get recipe by id', async () => {
		const response = await request(app)
			.get(`/recipes`)
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(200);
		const recipe = await request(app)
			.get(`/recipes/${response.body[0]._id}`)
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(200);
		expect(recipe.body.title).toEqual('user test');
	});

	it('should not get recipe with bad id', async () => {
		await request(app)
			.get(`/recipes/123`)
			.set('Authorization', `Bearer ${userOneToken}`)
			.send()
			.expect(500);
	});

	afterAll(async () => {
		User.deleteMany();
		Recipe.deleteMany();
	});
});
