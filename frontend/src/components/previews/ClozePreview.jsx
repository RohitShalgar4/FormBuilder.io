import React, { useState, useEffect } from 'react'
import { useDrag, useDrop } from 'react-dnd'

const ClozePreview = ({ question, preview = false }) => {
  const { settings } = question
  const [answers, setAnswers] = useState({})
  const [usedWords, setUsedWords] = useState(new Set())

  // Initialize usedWords based on existing answers
  useEffect(() => {
    const used = new Set()
    Object.values(answers).forEach(answer => {
      if (answer && settings.blanks?.includes(answer)) {
        used.add(answer)
      }
    })
    setUsedWords(used)
  }, [answers, settings.blanks])

  // Get available words (words that haven't been used yet)
  const availableWords = React.useMemo(() => 
    settings.blanks?.filter(word => !usedWords.has(word)) || [], 
    [settings.blanks, usedWords]
  )

  const handleAnswerChange = (blankIndex, value) => {
    const newAnswers = { ...answers }
    const oldAnswer = newAnswers[blankIndex]
    
    // Remove old answer from used words if it exists
    if (oldAnswer && settings.blanks?.includes(oldAnswer)) {
      setUsedWords(prev => {
        const newSet = new Set(prev)
        newSet.delete(oldAnswer)
        return newSet
      })
    }
    
    // Add new answer to used words if it's a valid option
    if (value && settings.blanks?.includes(value)) {
      setUsedWords(prev => new Set([...prev, value]))
    }
    
    newAnswers[blankIndex] = value
    setAnswers(newAnswers)
  }

  // Draggable Word Component
  const DraggableWord = ({ word }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'cloze-word',
      item: { word },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })

    return (
      <div
        ref={drag}
        className={`px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg cursor-move text-purple-800 font-medium transition-all ${
          isDragging ? 'opacity-50' : 'hover:bg-purple-200'
        }`}
      >
        {word}
      </div>
    )
  }

  // Droppable Blank Component
  const DroppableBlank = ({ blankIndex, currentAnswer }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'cloze-word',
      drop: (item) => handleAnswerChange(blankIndex, item.word),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    })

    const handleRemoveAnswer = () => {
      if (currentAnswer) {
        handleAnswerChange(blankIndex, '')
      }
    }

    return (
      <div
        ref={drop}
        className={`inline-block px-3 py-2 mx-1 rounded-lg border-2 border-dashed transition-colors ${
          isOver 
            ? 'border-purple-400 bg-purple-50' 
            : currentAnswer 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
        }`}
      >
        {currentAnswer ? (
          <span 
            className="text-green-800 font-medium cursor-pointer hover:text-green-600"
            onClick={handleRemoveAnswer}
            title="Click to remove"
          >
            {currentAnswer}
          </span>
        ) : (
          <span className="text-gray-500">Drop word here</span>
        )}
      </div>
    )
  }

  const renderTextWithBlanks = () => {
    let text = settings.text || ''
    const blankPattern = /\[(.*?)\]/g
    let blankIndex = 0
    
    const parts = text.split(blankPattern)
    const result = []
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text
        if (parts[i]) {
          result.push(
            <span key={`text-${i}`}>{parts[i]}</span>
          )
        }
      } else {
        // This is a blank
        const currentBlankIndex = blankIndex
        result.push(
          <DroppableBlank 
            key={`blank-${blankIndex}`}
            blankIndex={currentBlankIndex}
            currentAnswer={answers[currentBlankIndex]}
          />
        )
        blankIndex++
      }
    }
    
    return result
  }

  return (
    <div className="space-y-4">
      {preview && (
        <p className="text-sm text-gray-600 italic">
          Interactive preview - try dragging words to fill the blanks
        </p>
      )}
      
      {/* Word Options */}
      {settings.blanks && settings.blanks.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Word Options</h4>
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, index) => (
              <DraggableWord key={`${word}-${index}`} word={word} />
            ))}
            {availableWords.length === 0 && (
              <p className="text-gray-500 italic">All words have been used!</p>
            )}
          </div>
          {availableWords.length > 0 && (
            <p className="text-xs text-gray-500 mt-2 italic">
              💡 Drag words to fill in the blanks below
            </p>
          )}
        </div>
      )}
      
      {/* Text with Blanks */}
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 leading-relaxed text-gray-900">
        {renderTextWithBlanks()}
      </div>
      
      {settings.blanks && settings.blanks.length > 0 && (
        <div className="text-sm text-gray-600">
          <p>Fill in the blanks ({settings.blanks.length} total)</p>
        </div>
      )}
    </div>
  )
}

export default ClozePreview