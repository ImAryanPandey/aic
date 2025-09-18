import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const generateToken = (user) => {
    return jwt.sign({ id: user._id, }, process.env.JWT_SECRET, { expiresIn: '7d'} )
}

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const createUser = async ({ username, email, password }) => {
  const user = new User({ username, email, password });
  return user.save();
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');

  const valid = await user.comparePassword(password);
  if (!valid) throw new Error('Invalid credentials');

  return user;
};

