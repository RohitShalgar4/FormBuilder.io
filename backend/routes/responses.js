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
    
    console.log('💾 Saving public response with score:', score, 'maxScore:', maxScore);
    
    const response = new Response({
      ...req.body,
      score,
      maxScore,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    const savedResponse = await response.save();
    console.log('✅ Public response saved:', savedResponse._id, 'Score:', savedResponse.score, '/', savedResponse.maxScore);
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
    
    console.log('💾 Saving response with score:', score, 'maxScore:', maxScore);
    
    const response = new Response({
      ...req.body,
      userId: req.user._id,
      score,
      maxScore,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    const savedResponse = await response.save();
    console.log('✅ Authenticated response saved:', savedResponse._id, 'for user:', req.user._id, req.user.name, 'Score:', savedResponse.score, '/', savedResponse.maxScore);
    res.status(201).json(savedResponse);
  } catch (error) {
    console.error('❌ Authenticated response submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to validate and sanitize answers
const validateAnswers = (answers) => {
  if (!Array.isArray(answers)) {
    console.log('⚠️ Answers is not an array, converting to empty array');
    return [];
  }
  return answers.filter(answer => 
    answer && 
    typeof answer === 'object' && 
    answer.questionId && 
    answer.questionType && 
    answer.answer !== undefined
  );
};

// Helper function to calculate score
const calculateScore = async (formId, answers) => {
  try {
    console.log('🔍 Calculating score for form:', formId);
    console.log('📝 User answers:', JSON.stringify(answers, null, 2));
    
    // Validate and sanitize answers
    const validAnswers = validateAnswers(answers);
    console.log('✅ Valid answers:', validAnswers.length);
    
    const form = await Form.findById(formId);
    if (!form) {
      console.log('❌ Form not found');
      return { score: 0, maxScore: 0 };
    }
    
    console.log('📋 Form questions:', form.questions.length);
    form.questions.forEach((q, index) => {
      console.log(`  Q${index + 1}: ${q.title} (${q.type})`);
      if (q.settings) {
        console.log(`    Settings:`, JSON.stringify(q.settings, null, 2));
      }
    });

    let totalScore = 0;
    let totalMaxScore = 0;

    form.questions.forEach((question, questionIndex) => {
      console.log(`\n📋 Processing question ${questionIndex + 1}: ${question.title} (${question.type})`);
      
      const questionAnswer = validAnswers.find(a => a.questionId === question.id);
      console.log('📝 Question answer:', questionAnswer ? JSON.stringify(questionAnswer.answer, null, 2) : 'No answer');
      
      if (question.type === 'comprehension' && question.settings?.questions) {
        console.log('📖 Processing comprehension question');
        if (questionAnswer && questionAnswer.answer) {
          question.settings.questions.forEach((q, qIndex) => {
            const userAnswer = questionAnswer.answer[qIndex];
            const questionScore = q.score || 1;
            
            console.log(`  Q${qIndex + 1}: User answered ${userAnswer}, correct is ${q.correctAnswer}, score: ${questionScore}`);
            
            if (userAnswer !== undefined && q.correctAnswer !== undefined && userAnswer === q.correctAnswer) {
              totalScore += questionScore;
              console.log(`  ✅ Correct! Added ${questionScore} points`);
            } else if (userAnswer !== undefined && q.correctAnswer !== undefined) {
              console.log(`  ❌ Incorrect`);
            } else {
              console.log(`  ⚠️ Missing data - user: ${userAnswer}, correct: ${q.correctAnswer}`);
            }
            totalMaxScore += questionScore;
          });
        } else {
          // Add max score for unanswered questions
          question.settings.questions.forEach(q => {
            const questionScore = q.score || 1;
            totalMaxScore += questionScore;
            console.log(`  ⚠️ Unanswered question, max score: ${questionScore}`);
          });
        }
      } else if (question.type === 'categorize' && question.settings?.correctAnswers) {
        console.log('📂 Processing categorize question');
        console.log('📋 Correct answers:', JSON.stringify(question.settings.correctAnswers, null, 2));
        
        if (questionAnswer && questionAnswer.answer) {
          // Convert the answer format from {categoryName: [items]} to {itemIndex: categoryIndex}
          const itemToCategoryMap = {};
          
          // Build a map of which category each item belongs to
          Object.entries(questionAnswer.answer).forEach(([categoryName, items]) => {
            if (Array.isArray(items)) {
              items.forEach(item => {
                const itemIndex = question.settings.items.indexOf(item);
                const categoryIndex = question.settings.categories.indexOf(categoryName);
                if (itemIndex !== -1 && categoryIndex !== -1) {
                  itemToCategoryMap[itemIndex] = categoryIndex;
                }
              });
            }
          });
          
          console.log('🗺️ Item to category map:', itemToCategoryMap);
          
          question.settings.items.forEach((item, itemIndex) => {
            const userCategoryIndex = itemToCategoryMap[itemIndex];
            const correctCategoryIndex = question.settings.correctAnswers[itemIndex];
            const itemScore = question.settings.itemScores?.[itemIndex] || 1;
            
            console.log(`  Item "${item}": User put in category ${userCategoryIndex}, correct is ${correctCategoryIndex}, score: ${itemScore}`);
            
            // Only score if we have both user answer and correct answer
            if (userCategoryIndex !== undefined && correctCategoryIndex !== undefined && userCategoryIndex === correctCategoryIndex) {
              totalScore += itemScore;
              console.log(`  ✅ Correct! Added ${itemScore} points`);
            } else if (userCategoryIndex !== undefined && correctCategoryIndex !== undefined) {
              console.log(`  ❌ Incorrect`);
            } else {
              console.log(`  ⚠️ Missing data - user: ${userCategoryIndex}, correct: ${correctCategoryIndex}`);
            }
            totalMaxScore += itemScore;
          });
        } else {
          // Add max score for unanswered questions
          question.settings.items.forEach((item, itemIndex) => {
            const itemScore = question.settings.itemScores?.[itemIndex] || 1;
            totalMaxScore += itemScore;
            console.log(`  ⚠️ Unanswered item "${item}", max score: ${itemScore}`);
          });
        }
      } else if (question.type === 'cloze' && question.settings?.correctAnswers) {
        console.log('🔤 Processing cloze question');
        console.log('📋 Correct answers:', JSON.stringify(question.settings.correctAnswers, null, 2));
        
        if (questionAnswer && questionAnswer.answer) {
          question.settings.blanks.forEach((blank, blankIndex) => {
            const userAnswer = questionAnswer.answer[blankIndex];
            const correctAnswer = question.settings.correctAnswers[blankIndex];
            const blankScore = question.settings.blankScores?.[blankIndex] || 1;
            
            console.log(`  Blank ${blankIndex + 1}: User answered "${userAnswer}", correct is "${correctAnswer}", score: ${blankScore}`);
            
            // Case-insensitive comparison for cloze answers
            if (userAnswer && correctAnswer && 
                userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
              totalScore += blankScore;
              console.log(`  ✅ Correct! Added ${blankScore} points`);
            } else if (userAnswer && correctAnswer) {
              console.log(`  ❌ Incorrect`);
            } else {
              console.log(`  ⚠️ Missing data - user: "${userAnswer}", correct: "${correctAnswer}"`);
            }
            totalMaxScore += blankScore;
          });
        } else {
          // Add max score for unanswered questions
          question.settings.blanks.forEach((blank, blankIndex) => {
            const blankScore = question.settings.blankScores?.[blankIndex] || 1;
            totalMaxScore += blankScore;
            console.log(`  ⚠️ Unanswered blank ${blankIndex + 1}, max score: ${blankScore}`);
          });
        }
      }
    });

    console.log(`\n📊 Final score: ${totalScore}/${totalMaxScore} (${totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0}%)`);
    return { score: totalScore, maxScore: totalMaxScore };
  } catch (error) {
    console.error('❌ Error calculating score:', error);
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

// Test scoring endpoint (admin only) - for debugging
router.post('/test-scoring', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { formId, answers } = req.body;
    console.log('🧪 Testing scoring for form:', formId);
    console.log('📝 Test answers:', JSON.stringify(answers, null, 2));
    
    const result = await calculateScore(formId, answers);
    console.log('📊 Test scoring result:', result);
    
    res.json({
      message: 'Scoring test completed',
      result,
      formId,
      answers
    });
  } catch (error) {
    console.error('❌ Test scoring error:', error);
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
      submittedAt: response.submittedAt,
      score: response.score,
      maxScore: response.maxScore
    });
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching response:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;