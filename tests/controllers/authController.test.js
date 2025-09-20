import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../models/Users.js';
import * as authController from '../../controllers/authController.js';

jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedpassword'));
jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
jest.spyOn(jwt, 'sign').mockReturnValue('token123');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  jest.clearAllMocks(); 
  await User.deleteMany({});
});

describe('register', () => {
  it('returns 400 if any field is missing', async () => {
    const req = { body: { username: 'user' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await authController.register(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'All fields are required.' });
  });

  it('returns 400 if email already exists', async () => {
    await User.create({ username: 'x', email: 'test@mail.com', password: 'hash', role: 'attendee' });

    const req = { body: { username: 'user', email: 'test@mail.com', password: 'password', role: 'attendee' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await authController.register(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Email already exists.' });
  });

  it('registers a user and returns token', async () => {
    const req = { body: { username: 'user', email: 'new@mail.com', password: 'password', role: 'organizer' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await authController.register(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'User registered successfully',
      user: expect.objectContaining({ email: 'new@mail.com', role: 'organizer' }),
      token: 'token123'
    }));

    const user = await User.findOne({ email: 'new@mail.com' });
    expect(user).toBeTruthy();
  });
});

describe('login', () => {
  beforeEach(async () => {
    await new User({ username: 'user', email: 'login@mail.com', password: 'hashedpassword', role: 'attendee' }).save();
  });

  it('returns 400 if email or password is missing', async () => {
    const req = { body: { email: 'login@mail.com' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await authController.login(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Email and password are required.' });
  });

  it('returns 400 if user not found', async () => {
    const req = { body: { email: 'nonexistent@mail.com', password: 'pass' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await authController.login(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Invalid credentials.' });
  });

  it('returns 400 if password is incorrect', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    const req = { body: { email: 'login@mail.com', password: 'wrongpass' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await authController.login(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Invalid credentials.' });
  });

  it('logs in and returns token', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const req = { body: { email: 'login@mail.com', password: 'correctpass' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await authController.login(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      user: expect.objectContaining({ email: 'login@mail.com' }),
      token: 'token123'
    }));
  });
});

describe('logout', () => {
  it('returns 200 with logout message', async () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await authController.logout({}, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
  });
});
