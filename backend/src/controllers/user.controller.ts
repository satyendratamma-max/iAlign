import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      order: [['createdDate', 'DESC']],
    });

    res.json({
      success: true,
      data: users.map((user) => ({
        ...user.toJSON(),
        lastLoginAt: user.lastLoginDate,
        createdAt: user.createdDate,
        updatedAt: user.modifiedDate,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        lastLoginAt: user.lastLoginDate,
        createdAt: user.createdDate,
        updatedAt: user.modifiedDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    if (!username || !email || !password) {
      throw new ValidationError('Username, email, and password are required');
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash,
      firstName,
      lastName,
      role: role || 'User',
      isActive: true,
    });

    logger.info(`User created: ${user.email} by admin`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive, password } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update fields
    if (email !== undefined) user.email = email;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    // Update password if provided
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    logger.info(`User updated: ${user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.modifiedDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userEmail = user.email;
    await user.destroy();

    logger.info(`User deleted: ${userEmail}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users for mention autocomplete
 * Lightweight endpoint optimized for fast lookups
 */
export const searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    const query = (q as string || '').trim();

    const { Op } = require('sequelize');

    // If no query or query too short, return all active users
    if (!query || query.length < 2) {
      const users = await User.findAll({
        where: {
          isActive: true,
        },
        attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        limit: 50,
        order: [['firstName', 'ASC'], ['lastName', 'ASC']],
      });

      res.json({
        success: true,
        data: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: `${user.firstName} ${user.lastName}`,
        })),
      });
      return;
    }

    // Search with query - optimized for large datasets
    // Use left-anchored wildcards (query%) instead of (%query%) for better index usage
    const users = await User.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { firstName: { [Op.like]: `${query}%` } },  // Starts with (can use index)
          { lastName: { [Op.like]: `${query}%` } },   // Starts with (can use index)
          { email: { [Op.like]: `${query}%` } },      // Starts with (can use index)
          { username: { [Op.like]: `${query}%` } },   // Starts with (can use index)
        ],
      },
      attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
      limit: 15, // Show a few more results
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: `${user.firstName} ${user.lastName}`,
      })),
    });
    return;
  } catch (error) {
    next(error);
  }
};
