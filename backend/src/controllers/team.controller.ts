import { Request, Response, NextFunction } from 'express';
import Team from '../models/Team';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllTeams = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = await Team.findAll({
      where: { isActive: true },
      order: [['createdDate', 'DESC']],
    });

    res.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id);

    if (!team) {
      throw new ValidationError('Team not found');
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

export const createTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamData = req.body;

    const team = await Team.create({
      ...teamData,
      isActive: true,
    });

    logger.info(`Team created: ${team.name}`);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const team = await Team.findByPk(id);

    if (!team) {
      throw new ValidationError('Team not found');
    }

    await team.update(updateData);

    logger.info(`Team updated: ${team.name}`);

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id);

    if (!team) {
      throw new ValidationError('Team not found');
    }

    await team.update({ isActive: false });

    logger.info(`Team deleted: ${team.name}`);

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
