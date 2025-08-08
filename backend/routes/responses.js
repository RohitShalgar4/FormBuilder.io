const express = require('express');
const Response = require('../models/Response');
const Form = require('../models/Form');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Submit response (public access - no authentication required)
router.post('/', async (req, res) => {
  try {
    console.log('📝 Public response submission:', {
      formId: req.body.formId,
      hasUserId: !!req.body.userId,
      answersCount: req.body.answers?.length || 0,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Calculate score
    const { score, maxScore } = await calculateScore(req.body.formId, req.body.answers);
    
    const response = new Response({
      ...req.body,
      score,
      maxScore,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    const savedResponse = await response.save();
    console.log('✅ Public response saved:', savedResponse._id, 'Score:', score, '/', maxScore);
    res.status(201).json(savedResponse);
  } catch (error) {
    console.error('❌ Public response submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit response with authentication (for logged-in users)
router.post('/authenticated', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Authenticated response submission:', {
      formId: req.body.formId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      answersCount: req.body.answers?.length || 0,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Calculate score
    const { score, maxScore } = await calculateScore(req.body.formId, req.body.answers);
    
    const response = new Response({
      ...req.body,
      userId: req.user._id,
      score,
      maxScore,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    const savedResponse = await response.save();
    console.log('✅ Authenticated response saved:', savedResponse._id, 'for user:', req.user._id, req.user.name, 'Score:', score, '/', maxScore);
    res.status(201).json(savedResponse);
  } catch (error) {
    console.error('❌ Authenticated response submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate score
const calculateScore = async (formId, answers) => {
  try {
    const form = await Form.findById(formId);
    if (!form) {
      return { score: 0, maxScore: 0 };
    }

    let totalScore = 0;
    let totalMaxScore = 0;

    form.questions.forEach(question => {
      const questionAnswer = answers.find(a => a.questionId === question.id);
      
      if (question.type === 'comprehension' && question.settings?.questions) {
        if (questionAnswer && questionAnswer.answer) {
          question.settings.questions.forEach((q, qIndex) => {
            const userAnswer = questionAnswer.answer[qIndex];
            const questionScore = q.score || 1;
            
            if (userAnswer === q.correctAnswer) {
              totalScore += questionScore;
            }
            totalMaxScore += questionScore;
          });
        } else {
          // Add max score for unanswered questions
          question.settings.questions.forEach(q => {
            totalMaxScore += q.score || 1;
          });
        }
      } else if (question.type === 'categorize' && question.settings?.correctAnswers) {
        if (questionAnswer && questionAnswer.answer) {
          question.settings.items.forEach((item, itemIndex) => {
            const userCategory = questionAnswer.answer[itemIndex];
            const correctCategory = question.settings.correctAnswers[itemIndex];
            const itemScore = question.settings.itemScores?.[itemIndex] || 1;
            
            if (userCategory === correctCategory) {
              totalScore += itemScore;
            }
            totalMaxScore += itemScore;
          });
        } else {
          // Add max score for unanswered questions
          question.settings.items.forEach((item, itemIndex) => {
            totalMaxScore += question.settings.itemScores?.[itemIndex] || 1;
          });
        }
      } else if (question.type === 'cloze' && question.settings?.correctAnswers) {
        if (questionAnswer && questionAnswer.answer) {
          question.settings.blanks.forEach((blank, blankIndex) => {
            const userAnswer = questionAnswer.answer[blankIndex];
            const correctAnswer = question.settings.correctAnswers[blankIndex];
            const blankScore = question.settings.blankScores?.[blankIndex] || 1;
            
            // Case-insensitive comparison for cloze answers
            if (userAnswer && correctAnswer && 
                userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
              totalScore += blankScore;
            }
            totalMaxScore += blankScore;
          });
        } else {
          // Add max score for unanswered questions
          question.settings.blanks.forEach((blank, blankIndex) => {
            totalMaxScore += question.settings.blankScores?.[blankIndex] || 1;
          });
        }
      }
    });

    return { score: totalScore, maxScore: totalMaxScore };
  } catch (error) {
    console.error('Error calculating score:', error);
    return { score: 0, maxScore: 0 };
  }
};

// Get current user's responses
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const responses = await Response.find({ userId: req.user._id })
      .populate('formId', 'title description shareId')
      .sort({ submittedAt: -1 });
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get responses for a form (admin only)
router.get('/form/:formId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // First check if form exists
    const form = await Form.findById(req.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    console.log('🔍 Fetching responses for form:', req.params.formId);
    
    const responses = await Response.find({ formId: req.params.formId })
      .populate('userId', 'name email role')
      .sort({ submittedAt: -1 });
    
    console.log('📊 Form responses found:', responses.length);
    
    // Enhanced response data with user information
    const enhancedResponses = responses.map((response, index) => {
      const userInfo = {
        id: response.userId?._id || null,
        name: response.userId?.name || 'Anonymous',
        email: response.userId?.email || 'Anonymous',
        role: response.userId?.role || 'anonymous',
        isAuthenticated: !!response.userId
      };
      
      console.log(`Response ${index + 1}:`, {
        id: response._id,
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userRole: userInfo.role,
        isAuthenticated: userInfo.isAuthenticated,
        submittedAt: response.submittedAt,
        answersCount: response.answers?.length || 0,
        ipAddress: response.ipAddress
      });
      
      return {
        ...response.toObject(),
        userInfo
      };
    });
    
    res.json(enhancedResponses);
  } catch (error) {
    console.error('❌ Error fetching form responses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export responses for a form (admin only)
router.get('/export/:formId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Exporting responses for form:', req.params.formId);
    
    // First check if form exists
    const form = await Form.findById(req.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const responses = await Response.find({ formId: req.params.formId })
      .populate('userId', 'name email role')
      .sort({ submittedAt: -1 });
    
    console.log(`📈 Found ${responses.length} responses to export`);
    
    // Create CSV content with enhanced headers
    const headers = [
      'Response ID', 
      'User Name', 
      'User Email', 
      'Submitted At',
      'Score',
      'Max Score',
      'Score Percentage'
    ];
    
    // Add question headers
    const questionHeaders = form.questions.map((q, index) => `Q${index + 1}: ${q.title}`);
    headers.push(...questionHeaders);
    
    const csvRows = [headers.join(',')];
    
    responses.forEach((response, index) => {
      const userInfo = {
        name: response.userId?.name || 'Anonymous',
        email: response.userId?.email || 'Anonymous',
        role: response.userId?.role || 'anonymous',
        isAuthenticated: !!response.userId
      };
      
      const scorePercentage = response.maxScore > 0 ? Math.round((response.score / response.maxScore) * 100) : 0;
      
      console.log(`📝 Processing response ${index + 1}:`, {
        id: response._id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userRole: userInfo.role,
        isAuthenticated: userInfo.isAuthenticated,
        score: response.score,
        maxScore: response.maxScore,
        scorePercentage
      });
      
      const row = [
        response._id.toString(),
        `"${userInfo.name}"`,
        `"${userInfo.email}"`,
        new Date(response.submittedAt).toISOString(),
        response.score || 0,
        response.maxScore || 0,
        `${scorePercentage}%`
      ];
      
      // Process answers for each question
      form.questions.forEach((question, qIndex) => {
        const answer = response.answers.find(a => a.questionId === question.id);
        let answerText = '';
        
        if (answer) {
          switch (answer.questionType) {
            case 'categorize':
              answerText = JSON.stringify(answer.answer || {});
              break;
            case 'cloze':
              answerText = Object.values(answer.answer || {}).join('; ');
              break;
            case 'comprehension':
              answerText = Object.entries(answer.answer || {})
                .map(([qIndex, optionIndex]) => `Q${parseInt(qIndex) + 1}: Option ${parseInt(optionIndex) + 1}`)
                .join('; ');
              break;
            default:
              answerText = String(answer.answer || '');
          }
        }
        
        // Escape commas and quotes in CSV
        answerText = answerText.replace(/"/g, '""');
        row.push(`"${answerText}"`);
      });
      
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Set proper headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses_${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    console.log('✅ Export completed successfully');
    res.send(csvContent);
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export single response (admin only)
router.get('/export-single/:responseId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Exporting single response:', req.params.responseId);
    
    const response = await Response.findById(req.params.responseId)
      .populate('formId')
      .populate('userId', 'name email role');
      
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    const form = response.formId;
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    console.log('📝 Processing single response export:', {
      responseId: response._id,
      formTitle: form.title,
      userName: response.userId?.name || 'Anonymous',
      userEmail: response.userId?.email || 'Anonymous'
    });
    
    // Create CSV content for single response with enhanced headers
    const headers = [
      'Response ID', 
      'User Name', 
      'User Email', 
      'Submitted At',
      'Score',
      'Max Score',
      'Score Percentage'
    ];
    
    const questionHeaders = form.questions.map((q, index) => `Q${index + 1}: ${q.title}`);
    headers.push(...questionHeaders);
    
    const csvRows = [headers.join(',')];
    
    const userInfo = {
      name: response.userId?.name || 'Anonymous',
      email: response.userId?.email || 'Anonymous',
      role: response.userId?.role || 'anonymous',
      isAuthenticated: !!response.userId
    };
    
    const scorePercentage = response.maxScore > 0 ? Math.round((response.score / response.maxScore) * 100) : 0;
    
    const row = [
      response._id.toString(),
      `"${userInfo.name}"`,
      `"${userInfo.email}"`,
      new Date(response.submittedAt).toISOString(),
      response.score || 0,
      response.maxScore || 0,
      `${scorePercentage}%`
    ];
    
    // Process answers for each question
    form.questions.forEach((question, qIndex) => {
      const answer = response.answers.find(a => a.questionId === question.id);
      let answerText = '';
      
      if (answer) {
        switch (answer.questionType) {
          case 'categorize':
            answerText = JSON.stringify(answer.answer || {});
            break;
          case 'cloze':
            answerText = Object.values(answer.answer || {}).join('; ');
            break;
          case 'comprehension':
            answerText = Object.entries(answer.answer || {})
              .map(([qIndex, optionIndex]) => `Q${parseInt(qIndex) + 1}: Option ${parseInt(optionIndex) + 1}`)
              .join('; ');
            break;
          default:
            answerText = String(answer.answer || '');
        }
      }
      
      // Escape commas and quotes in CSV
      answerText = answerText.replace(/"/g, '""');
      row.push(`"${answerText}"`);
    });
    
    csvRows.push(row.join(','));
    const csvContent = csvRows.join('\n');
    
    // Set proper headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="response-${response._id.toString().slice(-8)}_${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    console.log('✅ Single response export completed successfully');
    res.send(csvContent);
  } catch (error) {
    console.error('❌ Single response export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single response by ID (admin only) - must be last to avoid conflicts
router.get('/:responseId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching response with ID:', req.params.responseId);
    
    // Validate ObjectId format
    if (!req.params.responseId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid response ID format' });
    }
    
    const response = await Response.findById(req.params.responseId)
      .populate('formId', 'title description questions shareId')
      .populate('userId', 'name email');
    
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    console.log('✅ Response found:', {
      id: response._id,
      formId: response.formId?._id || response.formId,
      userId: response.userId?._id || 'null',
      userName: response.userId?.name || 'Anonymous',
      userEmail: response.userId?.email || 'Anonymous',
      submittedAt: response.submittedAt
    });
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching response:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;