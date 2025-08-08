import React, { useState, useEffect } from 'react'
import { Info } from 'lucide-react'

const ClozeEditor = ({ question, onUpdate }) => {
  const [text, setText] = useState(question.settings?.text || '')

  useEffect(() => {
    // Extract blanks from text
    const blankPattern = /\[(.*?)\]/g
    const blanks = []
    let match
    
    while ((match = blankPattern.exec(text)) !== null) {
      blanks.push(match[1])
    }
    
    onUpdate({
      settings: { ...question.settings, text, blanks }
    })
  }, [text, question.settings])

  const insertBlank = () => {
    const textarea = document.getElementById(`cloze-text-${question.id}`)
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = text.substring(start, end)
      const beforeText = text.substring(0, start)
      const afterText = text.substring(end)
      
      if (selectedText) {
        const newText = beforeText + `[${selectedText}]` + afterText
        setText(newText)
      } else {
        const newText = beforeText + '[blank]' + afterText
        setText(newText)
      }
    }
  }

  const updateCorrectAnswer = (blankIndex, answer) => {
    const newCorrectAnswers = { ...question.settings.correctAnswers }
    newCorrectAnswers[blankIndex] = answer
    onUpdate({
      settings: { ...question.settings, correctAnswers: newCorrectAnswers }
    })
  }

  const updateBlankScore = (blankIndex, score) => {
    const newBlankScores = { ...question.settings.blankScores }
    newBlankScores[blankIndex] = parseInt(score) || 1
    onUpdate({
      settings: { ...question.settings, blankScores: newBlankScores }
    })
  }

  const updateMaxScore = (maxScore) => {
    onUpdate({
      settings: { ...question.settings, maxScore: parseInt(maxScore) || 0 }
    })
  }

  // Calculate total max score
  const totalMaxScore = question.settings?.blanks?.reduce((sum, _, index) => {
    return sum + (question.settings.blankScores?.[index] || 1)
  }, 0) || 0

  const renderPreview = () => {
    let previewText = text
    const blankPattern = /\[(.*?)\]/g
    let blankIndex = 0
    
    previewText = previewText.replace(blankPattern, () => {
      blankIndex++
      return `<input type="text" placeholder="Blank ${blankIndex}" class="inline-block px-2 py-1 border border-gray-300 rounded bg-white min-w-[100px] mx-1" readonly />`
    })
    
    return { __html: previewText }
  }

  return (
    <div className="space-y-6">
      {/* Max Score */}
      <div>
        <label className="text-sm font-medium text-gray-900 mb-2 block">
          Maximum Score
        </label>
        <input
          type="number"
          min="0"
          value={question.settings?.maxScore || totalMaxScore}
          onChange={(e) => updateMaxScore(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter maximum score"
        />
        <p className="text-xs text-gray-500 mt-1">
          Total score from all blanks: {totalMaxScore}
        </p>
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-blue-800 font-medium">How to create blanks:</p>
          <p className="text-blue-700 mt-1">
            Select text and click "Make Blank" or manually wrap text with square brackets: [answer]
          </p>
        </div>
      </div>

      {/* Text Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-900">
            Text with Blanks
          </label>
          <button
            onClick={insertBlank}
            className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
          >
            Make Blank
          </button>
        </div>
        <textarea
          id={`cloze-text-${question.id}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Enter your text here. Select words and click 'Make Blank' to create blanks, or use [square brackets] around words."
        />
      </div>

      {/* Detected Blanks */}
      {question.settings?.blanks && question.settings.blanks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Detected Blanks ({question.settings.blanks.length})
          </h4>
          <div className="space-y-3">
            {question.settings.blanks.map((blank, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Blank {index + 1}:
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
                    {blank}
                  </span>
                </div>
                
                {/* Correct Answer */}
                <div className="mb-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Correct Answer:
                  </label>
                  <input
                    type="text"
                    value={question.settings.correctAnswers?.[index] || ''}
                    onChange={(e) => updateCorrectAnswer(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter correct answer"
                  />
                </div>

                {/* Blank Score */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Blank Score:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={question.settings.blankScores?.[index] || 1}
                    onChange={(e) => updateBlankScore(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter blank score"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
        <div 
          className="p-4 border border-gray-300 rounded-lg bg-gray-50"
          dangerouslySetInnerHTML={renderPreview()}
        />
      </div>
    </div>
  )
}

export default ClozeEditor