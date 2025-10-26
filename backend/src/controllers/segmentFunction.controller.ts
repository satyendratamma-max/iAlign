import { Request, Response, NextFunction } from 'express';
import SegmentFunction from '../models/SegmentFunction';
import Domain from '../models/Domain';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { calculateSegmentFunctionRisk, SegmentFunctionRisk } from '../utils/riskCalculator';

export const getAllSegmentFunctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sortOrder } = req.query;

    // Default to ascending (A-Z), support 'asc' or 'desc'
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const segmentFunctions = await SegmentFunction.findAll({
      where: { isActive: true },
      order: [['name', order]], // Sort alphabetically by name
      include: [
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
      ],
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

/**
 * Calculate and return risk score with detailed breakdown for a segment function
 */
export const getSegmentFunctionRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { scenarioId } = req.query;

    // Validate segment function exists
    const segmentFunction = await SegmentFunction.findByPk(id);
    if (!segmentFunction) {
      throw new ValidationError('Segment Function not found');
    }

    // Default to scenario ID 1 (baseline) if not provided
    const activeScenarioId = scenarioId ? parseInt(scenarioId as string) : 1;

    // Calculate risk score with breakdown
    const riskData: SegmentFunctionRisk = await calculateSegmentFunctionRisk(
      parseInt(id),
      activeScenarioId
    );

    res.json({
      success: true,
      data: {
        segmentFunctionId: parseInt(id),
        segmentFunctionName: segmentFunction.name,
        scenarioId: activeScenarioId,
        ...riskData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch endpoint: Calculate risk for multiple segment functions at once
 * Accepts query params: ids (comma-separated) and scenarioId
 * Example: GET /segment-functions/batch-risk?ids=1,2,3&scenarioId=1
 */
export const getBatchSegmentFunctionRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, scenarioId } = req.query;

    if (!ids || typeof ids !== 'string') {
      throw new ValidationError('ids query parameter is required (comma-separated list)');
    }

    // Parse and validate IDs
    const segmentFunctionIds = ids.split(',').map(id => {
      const parsed = parseInt(id.trim());
      if (isNaN(parsed)) {
        throw new ValidationError(`Invalid segment function ID: ${id}`);
      }
      return parsed;
    });

    if (segmentFunctionIds.length === 0) {
      throw new ValidationError('At least one segment function ID is required');
    }

    // Default to scenario ID 1 (baseline) if not provided
    const activeScenarioId = scenarioId ? parseInt(scenarioId as string) : 1;

    // Fetch segment functions to validate they exist
    const segmentFunctions = await SegmentFunction.findAll({
      where: { id: segmentFunctionIds },
      attributes: ['id', 'name'],
    });

    // Create a map of segment function names
    const segmentFunctionMap = new Map(
      segmentFunctions.map(sf => [sf.id, sf.name])
    );

    // Calculate risks for all segment functions in parallel
    const riskPromises = segmentFunctionIds.map(async (segmentFunctionId) => {
      try {
        const riskData = await calculateSegmentFunctionRisk(segmentFunctionId, activeScenarioId);
        return {
          segmentFunctionId,
          segmentFunctionName: segmentFunctionMap.get(segmentFunctionId) || `Segment Function ${segmentFunctionId}`,
          scenarioId: activeScenarioId,
          ...riskData,
        };
      } catch (error) {
        logger.error(`Error calculating risk for segment function ${segmentFunctionId}:`, error);
        // Return null for failed calculations instead of breaking the entire batch
        return null;
      }
    });

    const results = await Promise.all(riskPromises);

    // Filter out any failed calculations
    const successfulResults = results.filter(r => r !== null);

    res.json({
      success: true,
      data: successfulResults,
      count: successfulResults.length,
      requested: segmentFunctionIds.length,
    });
  } catch (error) {
    next(error);
  }
};
