import { Request, Response } from 'express';
import Milestone from '../models/Milestone';
import Project from '../models/Project';
import User from '../models/User';

export const getAllMilestones = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    const where: any = { isActive: true };
    if (projectId) {
      where.projectId = projectId;
    }

    const milestones = await Milestone.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      order: [['plannedStartDate', 'ASC']],
    });

    res.json({
      success: true,
      data: milestones,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching milestones',
      error: error.message,
    });
  }
};

export const getMilestoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const milestone = await Milestone.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: Project,
          as: 'project',
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found',
      });
    }

    return res.json({
      success: true,
      data: milestone,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching milestone',
      error: error.message,
    });
  }
};

export const createMilestone = async (req: Request, res: Response) => {
  try {
    const milestone = await Milestone.create(req.body);

    res.status(201).json({
      success: true,
      data: milestone,
      message: 'Milestone created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Error creating milestone',
      error: error.message,
    });
  }
};

export const updateMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const milestone = await Milestone.findOne({
      where: { id, isActive: true },
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found',
      });
    }

    await milestone.update(req.body);

    return res.json({
      success: true,
      data: milestone,
      message: 'Milestone updated successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating milestone',
      error: error.message,
    });
  }
};

export const deleteMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const milestone = await Milestone.findOne({
      where: { id, isActive: true },
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found',
      });
    }

    // Soft delete
    await milestone.update({ isActive: false });

    return res.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting milestone',
      error: error.message,
    });
  }
};

export const getProjectMilestones = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const milestones = await Milestone.findAll({
      where: { projectId, isActive: true },
      order: [['plannedStartDate', 'ASC']],
    });

    res.json({
      success: true,
      data: milestones,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project milestones',
      error: error.message,
    });
  }
};
