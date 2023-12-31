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
	email: 'test@test.com',
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
	email: 'test1@test.com',
	password: 'test1234',
	role: 'admin',
	tokens: [
		{
			token: userTwoToken,
		},
	],
};

describe('POST /recipes', () => {
	it('should return true', () => {
		expect(true).toBe(true);
	});
});
