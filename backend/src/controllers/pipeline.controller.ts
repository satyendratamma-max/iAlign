import { Request, Response } from 'express';
import Pipeline from '../models/Pipeline';
import ProjectPipeline from '../models/ProjectPipeline';
import Project from '../models/Project';

export const getAllPipelines = async (req: Request, res: Response) => {
  try {
    const { type, vendor } = req.query;

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (vendor) where.vendor = vendor;

    const pipelines = await Pipeline.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: pipelines,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pipelines',
      error: error.message,
    });
  }
};

export const getPipelineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pipeline = await Pipeline.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: ProjectPipeline,
          as: 'projectPipelines',
          include: [
            {
              model: Project,
              as: 'project',
              attributes: ['id', 'name', 'status'],
            },
          ],
        },
      ],
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    return res.json({
      success: true,
      data: pipeline,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching pipeline',
      error: error.message,
    });
  }
};

export const createPipeline = async (req: Request, res: Response) => {
  try {
    const pipeline = await Pipeline.create(req.body);

    res.status(201).json({
      success: true,
      data: pipeline,
      message: 'Pipeline created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Error creating pipeline',
      error: error.message,
    });
  }
};

export const updatePipeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pipeline = await Pipeline.findOne({
      where: { id, isActive: true },
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    await pipeline.update(req.body);

    return res.json({
      success: true,
      data: pipeline,
      message: 'Pipeline updated successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating pipeline',
      error: error.message,
    });
  }
};

export const deletePipeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pipeline = await Pipeline.findOne({
      where: { id, isActive: true },
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    // Soft delete
    await pipeline.update({ isActive: false });

    return res.json({
      success: true,
      message: 'Pipeline deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting pipeline',
      error: error.message,
    });
  }
};

// Project-Pipeline relationship management
export const getProjectPipelines = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const projectPipelines = await ProjectPipeline.findAll({
      where: { projectId, isActive: true },
      include: [
        {
          model: Pipeline,
          as: 'pipeline',
        },
      ],
    });

    res.json({
      success: true,
      data: projectPipelines,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project pipelines',
      error: error.message,
    });
  }
};

export const addPipelineToProject = async (req: Request, res: Response) => {
  try {
    const projectPipeline = await ProjectPipeline.create(req.body);

    const fullData = await ProjectPipeline.findOne({
      where: { id: projectPipeline.id },
      include: [
        {
          model: Pipeline,
          as: 'pipeline',
        },
        {
          model: Project,
          as: 'project',
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: fullData,
      message: 'Pipeline added to project successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Error adding pipeline to project',
      error: error.message,
    });
  }
};

export const updateProjectPipeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const projectPipeline = await ProjectPipeline.findOne({
      where: { id, isActive: true },
    });

    if (!projectPipeline) {
      return res.status(404).json({
        success: false,
        message: 'Project-Pipeline relationship not found',
      });
    }

    await projectPipeline.update(req.body);

    const updatedData = await ProjectPipeline.findOne({
      where: { id },
      include: [
        {
          model: Pipeline,
          as: 'pipeline',
        },
        {
          model: Project,
          as: 'project',
        },
      ],
    });

    return res.json({
      success: true,
      data: updatedData,
      message: 'Project-Pipeline relationship updated successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating project-pipeline relationship',
      error: error.message,
    });
  }
};

export const removePipelineFromProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const projectPipeline = await ProjectPipeline.findOne({
      where: { id, isActive: true },
    });

    if (!projectPipeline) {
      return res.status(404).json({
        success: false,
        message: 'Project-Pipeline relationship not found',
      });
    }

    await projectPipeline.update({ isActive: false });

    return res.json({
      success: true,
      message: 'Pipeline removed from project successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error removing pipeline from project',
      error: error.message,
    });
  }
};
