import express from 'express';
import {
    createMeeting,
    getMeeting,
    joinMeeting,
    endMeeting,
    getInstituteDossier,
    stampBlockchain,
    recordVote
} from '../controllers/samvaadController.js';

const router = express.Router();

router.post('/meetings/create', createMeeting);
router.post('/meetings/join', joinMeeting);
router.post('/meetings/:roomId/end', endMeeting);
router.get('/meetings/:roomId', getMeeting);
router.get('/institute/:id', getInstituteDossier);
router.post('/blockchain/stamp', stampBlockchain);
router.post('/vote', recordVote);

export default router;
