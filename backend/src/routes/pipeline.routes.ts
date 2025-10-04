import { Router } from 'express';
import {
  getAllPipelines,
  getPipelineById,
  createPipeline,
  updatePipeline,
  deletePipeline,
  getProjectPipelines,
  addPipelineToProject,
  updateProjectPipeline,
  removePipelineFromProject,
} from '../controllers/pipeline.controller';

const router = Router();

// Pipeline CRUD
router.get('/', getAllPipelines);
router.get('/:id', getPipelineById);
router.post('/', createPipeline);
router.put('/:id', updatePipeline);
router.delete('/:id', deletePipeline);

// Project-Pipeline relationship
router.get('/project/:projectId', getProjectPipelines);
router.post('/project-pipeline', addPipelineToProject);
router.put('/project-pipeline/:id', updateProjectPipeline);
router.delete('/project-pipeline/:id', removePipelineFromProject);

export default router;
