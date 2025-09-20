import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import bodyParser from 'body-parser';

import authRouter from '../../routes/auth.js';
import User from '../../models/Users.js';
import * as authController from '../../controllers/authController.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth API Routes', () => {
  let app;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(bodyParser.json());
    app.use('/api/auth', authRouter);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('returns 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'user' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('All fields are required.');
    });

    it('returns 400 if email already exists', async () => {
      await User.create({ username: 'existing', email: 'existing@mail.com', password: 'hash', role: 'attendee' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'user', email: 'existing@mail.com', password: 'password', role: 'attendee' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email already exists.');
    });

    it('registers user and returns token', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpass');
      jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', email: 'new@mail.com', password: 'password', role: 'organizer' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.user.email).toBe('new@mail.com');
      expect(res.body.token).toBe('fake-jwt-token');

      const user = await User.findOne({ email: 'new@mail.com' });
      expect(user).toBeTruthy();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpass');
      await User.create({ username: 'loginuser', email: 'login@mail.com', password: 'hashedpass', role: 'attendee' });
    });

    it('returns 400 if email or password missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@mail.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email and password are required.');
    });

    it('returns 400 if user not found', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@mail.com', password: 'pass' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('returns 400 if password is incorrect', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@mail.com', password: 'wrongpass' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('logs in successfully and returns token', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@mail.com', password: 'correctpass' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.user.email).toBe('login@mail.com');
      expect(res.body.token).toBe('fake-jwt-token');
    });
  });

  describe('GET /api/auth/logout', () => {
    it('returns logout success message', async () => {
      const res = await request(app)
        .get('/api/auth/logout');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });
});
