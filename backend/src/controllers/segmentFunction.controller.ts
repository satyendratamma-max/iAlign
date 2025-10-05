import { Request, Response, NextFunction } from 'express';
import SegmentFunction from '../models/SegmentFunction';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllSegmentFunctions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const segmentFunctions = await SegmentFunction.findAll({
      where: { isActive: true },
      order: [['createdDate', 'DESC']],
    });

    res.json({
      success: true,
      data: segmentFunctions,
    });
  } catch (error) {
    next(error);
  }
};

export const getSegmentFunctionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const segmentFunction = await SegmentFunction.findByPk(id);

    if (!segmentFunction) {
      throw new ValidationError('Segment Function not found');
    }

    res.json({
      success: true,
      data: segmentFunction,
    });
  } catch (error) {
    next(error);
  }
};

export const createSegmentFunction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segmentFunctionData = req.body;

    const segmentFunction = await SegmentFunction.create({
      ...segmentFunctionData,
      isActive: true,
    });

    logger.info(`Segment Function created: ${segmentFunction.name}`);

    res.status(201).json({
      success: true,
      message: 'Segment Function created successfully',
      data: segmentFunction,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSegmentFunction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const segmentFunction = await SegmentFunction.findByPk(id);

    if (!segmentFunction) {
      throw new ValidationError('Segment Function not found');
    }

    await segmentFunction.update(updateData);

    logger.info(`Segment Function updated: ${segmentFunction.name}`);

    res.json({
      success: true,
      message: 'Segment Function updated successfully',
      data: segmentFunction,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSegmentFunction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const segmentFunction = await SegmentFunction.findByPk(id);

    if (!segmentFunction) {
      throw new ValidationError('Segment Function not found');
    }

    // Soft delete
    await segmentFunction.update({ isActive: false });

    logger.info(`Segment Function deleted: ${segmentFunction.name}`);

    res.json({
      success: true,
      message: 'Segment Function deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getSegmentFunctionStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const segmentFunctions = await SegmentFunction.findAll({
      where: { isActive: true },
    });

    const totalValue = segmentFunctions.reduce((sum, p) => sum + (Number(p.totalValue) || 0), 0);
    const avgROI = segmentFunctions.reduce((sum, p) => sum + (Number(p.roiIndex) || 0), 0) / segmentFunctions.length || 0;
    const avgRisk = segmentFunctions.reduce((sum, p) => sum + (Number(p.riskScore) || 0), 0) / segmentFunctions.length || 0;

    res.json({
      success: true,
      data: {
        totalSegmentFunctions: segmentFunctions.length,
        totalValue,
        averageROI: avgROI,
        averageRisk: avgRisk,
      },
    });
  } catch (error) {
    next(error);
  }
};
