import { Request, Response } from 'express';
import CapacityModel from '../models/CapacityModel';
import CapacityScenario from '../models/CapacityScenario';
import Domain from '../models/Domain';
import User from '../models/User';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';

export const getAllModels = async (req: Request, res: Response) => {
  try {
    const { fiscalYear, modelType } = req.query;

    const where: any = { isActive: true };
    if (fiscalYear) where.fiscalYear = fiscalYear;
    if (modelType) where.modelType = modelType;

    const models = await CapacityModel.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdDate', 'DESC']],
    });

    return res.json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching capacity models',
      error: error.message,
    });
  }
};

export const getModelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const model = await CapacityModel.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: CapacityScenario,
          as: 'scenarios',
          include: [
            {
              model: Domain,
              as: 'domain',
              attributes: ['id', 'name'],
            },
            {
              model: App,
              as: 'app',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Technology,
              as: 'technology',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'code'],
            },
          ],
        },
      ],
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Capacity model not found',
      });
    }

    return res.json({
      success: true,
      data: model,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching capacity model',
      error: error.message,
    });
  }
};

export const createModel = async (req: Request, res: Response) => {
  try {
    const model = await CapacityModel.create(req.body);

    const fullModel = await CapacityModel.findOne({
      where: { id: model.id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: fullModel,
      message: 'Capacity model created successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error creating capacity model',
      error: error.message,
    });
  }
};

export const updateModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const model = await CapacityModel.findOne({
      where: { id, isActive: true },
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Capacity model not found',
      });
    }

    await model.update(req.body);

    const updatedModel = await CapacityModel.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return res.json({
      success: true,
      data: updatedModel,
      message: 'Capacity model updated successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating capacity model',
      error: error.message,
    });
  }
};

export const deleteModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const model = await CapacityModel.findOne({
      where: { id, isActive: true },
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Capacity model not found',
      });
    }

    // Soft delete
    await model.update({ isActive: false });

    return res.json({
      success: true,
      message: 'Capacity model deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting capacity model',
      error: error.message,
    });
  }
};

// Scenario management
export const getAllScenarios = async (req: Request, res: Response) => {
  try {
    const { capacityModelId, domainId, appId, technologyId, roleId } = req.query;

    const where: any = {};
    if (capacityModelId) where.capacityModelId = capacityModelId;
    if (domainId) where.domainId = domainId;
    if (appId) where.appId = appId;
    if (technologyId) where.technologyId = technologyId;
    if (roleId) where.roleId = roleId;

    const scenarios = await CapacityScenario.findAll({
      where,
      include: [
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
        {
          model: App,
          as: 'app',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Technology,
          as: 'technology',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: CapacityModel,
          as: 'capacityModel',
          attributes: ['id', 'name', 'modelType'],
        },
      ],
      order: [['domainId', 'ASC']],
    });

    return res.json({
      success: true,
      data: scenarios,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching scenarios',
      error: error.message,
    });
  }
};

export const getScenarioById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const scenario = await CapacityScenario.findOne({
      where: { id },
      include: [
        {
          model: Domain,
          as: 'domain',
        },
        {
          model: App,
          as: 'app',
        },
        {
          model: Technology,
          as: 'technology',
        },
        {
          model: Role,
          as: 'role',
        },
        {
          model: CapacityModel,
          as: 'capacityModel',
        },
      ],
    });

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Scenario not found',
      });
    }

    return res.json({
      success: true,
      data: scenario,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching scenario',
      error: error.message,
    });
  }
};

export const createScenario = async (req: Request, res: Response) => {
  try {
    const scenario = await CapacityScenario.create(req.body);

    const fullScenario = await CapacityScenario.findOne({
      where: { id: scenario.id },
      include: [
        {
          model: Domain,
          as: 'domain',
        },
        {
          model: App,
          as: 'app',
        },
        {
          model: Technology,
          as: 'technology',
        },
        {
          model: Role,
          as: 'role',
        },
        {
          model: CapacityModel,
          as: 'capacityModel',
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: fullScenario,
      message: 'Scenario created successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error creating scenario',
      error: error.message,
    });
  }
};

export const updateScenario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const scenario = await CapacityScenario.findOne({
      where: { id },
    });

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Scenario not found',
      });
    }

    await scenario.update(req.body);

    const updatedScenario = await CapacityScenario.findOne({
      where: { id },
      include: [
        {
          model: Domain,
          as: 'domain',
        },
        {
          model: App,
          as: 'app',
        },
        {
          model: Technology,
          as: 'technology',
        },
        {
          model: Role,
          as: 'role',
        },
        {
          model: CapacityModel,
          as: 'capacityModel',
        },
      ],
    });

    return res.json({
      success: true,
      data: updatedScenario,
      message: 'Scenario updated successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating scenario',
      error: error.message,
    });
  }
};

export const deleteScenario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const scenario = await CapacityScenario.findByPk(id);

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Scenario not found',
      });
    }

    await scenario.destroy();

    return res.json({
      success: true,
      message: 'Scenario deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting scenario',
      error: error.message,
    });
  }
};

export const compareModels = async (req: Request, res: Response) => {
  try {
    const { modelIds } = req.query;

    if (!modelIds) {
      return res.status(400).json({
        success: false,
        message: 'Model IDs are required',
      });
    }

    const ids = (modelIds as string).split(',').map(id => parseInt(id));

    const models = await CapacityModel.findAll({
      where: { id: ids, isActive: true },
      include: [
        {
          model: CapacityScenario,
          as: 'scenarios',
          include: [
            {
              model: Domain,
              as: 'domain',
            },
            {
              model: App,
              as: 'app',
            },
            {
              model: Technology,
              as: 'technology',
            },
            {
              model: Role,
              as: 'role',
            },
          ],
        },
      ],
    });

    return res.json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error comparing models',
      error: error.message,
    });
  }
};
