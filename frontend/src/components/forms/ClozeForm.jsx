import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useDrag, useDrop } from 'react-dnd'

const ClozeForm = ({ question, answer = {}, onChange, error }) => {
  // Add safety check for question and settings
  if (!question || !question.settings) {
    return (
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-500">Loading question...</p>
      </div>
    )
  }

  const { settings } = question
  const [answers, setAnswers] = useState({})
  const [usedWords, setUsedWords] = useState(new Set())
  const [initialized, setInitialized] = useState(false)

  // Initialize only once when component mounts
  useEffect(() => {
    if (!initialized && settings.blanks && settings.text) {
      console.log('📦 ClozeForm - Initial setup')
      
      if (answer && typeof answer === 'object' && Object.keys(answer).length > 0) {
        setAnswers(answer)
      } else {
        setAnswers({})
      }
      
      setInitialized(true)
    }
  }, [initialized, settings.blanks, settings.text, answer])

  // Update used words when answers change
  useEffect(() => {
    if (initialized && settings.blanks) {
      const used = new Set()
      Object.values(answers).forEach(answerValue => {
        if (answerValue && settings.blanks.includes(answerValue)) {
          used.add(answerValue)
        }
      })
      console.log('🔤 Used words updated:', Array.from(used))
      setUsedWords(used)
    }
  }, [answers, initialized, settings.blanks])

  // Get available words (words that haven't been used yet)
  const availableWords = useMemo(() => {
    if (!settings.blanks) return []
    return settings.blanks.filter(word => !usedWords.has(word))
  }, [settings.blanks, usedWords])

  // Memoized answer change handler
  const handleAnswerChange = useCallback((blankIndex, value) => {
    console.log('🚀 Changing answer for blank:', blankIndex, 'to:', value)
    
    setAnswers(prev => {
      const newAnswers = { ...prev }
      newAnswers[blankIndex] = value
      
      console.log('📝 New answers:', newAnswers)
      
      // Notify parent
      if (onChange) {
        onChange(newAnswers)
      }
      
      return newAnswers
    })
  }, [onChange])

  // Draggable Word Component
  const DraggableWord = ({ word }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'cloze-word',
      item: { word },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }), [word])

    return (
      <div
        ref={drag}
        className={`px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg cursor-move text-purple-800 font-medium transition-all select-none ${
          isDragging ? 'opacity-50' : 'hover:bg-purple-200'
        }`}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {word}
      </div>
    )
  }

  // Droppable Blank Component
  const DroppableBlank = ({ blankIndex, currentAnswer }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: 'cloze-word',
      drop: (draggedItem, monitor) => {
        if (monitor.didDrop()) {
          return
        }
        console.log('📥 Dropped word in blank:', draggedItem.word, 'at index:', blankIndex)
        handleAnswerChange(blankIndex, draggedItem.word)
        return { moved: true }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }), [blankIndex, handleAnswerChange])

    const isActive = isOver && canDrop

    const handleRemoveAnswer = useCallback(() => {
      if (currentAnswer) {
        console.log('🗑️ Removing answer from blank:', blankIndex)
        handleAnswerChange(blankIndex, '')
      }
    }, [currentAnswer, blankIndex, handleAnswerChange])

    return (
      <div
        ref={drop}
        className={`inline-block px-3 py-2 mx-1 rounded-lg border-2 border-dashed transition-all min-w-[120px] text-center ${
          isActive 
            ? 'border-purple-400 bg-purple-50 shadow-lg' 
            : currentAnswer 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
        }`}
      >
        {currentAnswer ? (
          <span 
            className="text-green-800 font-medium cursor-pointer hover:text-green-600 select-none"
            onClick={handleRemoveAnswer}
            title="Click to remove"
          >
            {currentAnswer}
          </span>
        ) : (
          <span className="text-gray-500 text-sm">Drop word here</span>
        )}
      </div>
    )
  }

  const renderTextWithBlanks = () => {
    const text = settings.text || ''
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
            currentAnswer={answers[currentBlankIndex] || ''}
          />
        )
        blankIndex++
      }
    }
    
    return result
  }

  if (!initialized) {
    return (
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-500">Initializing...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Word Options */}
      {settings.blanks && settings.blanks.length > 0 ? (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Word Options</h4>
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, index) => (
              <DraggableWord key={`${word}-${index}`} word={word} />
            ))}
            {availableWords.length === 0 && (
              <p className="text-gray-500 italic">All words have been used! 🎉</p>
            )}
          </div>
          {availableWords.length > 0 && (
            <p className="text-xs text-gray-500 mt-2 italic">
              💡 Drag words to fill in the blanks below
            </p>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-gray-500 italic">No word options available</p>
        </div>
      )}
      
      {/* Text with Blanks */}
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 leading-relaxed text-gray-900">
        {renderTextWithBlanks()}
      </div>
      
      {settings.blanks && settings.blanks.length > 0 && (
        <div className="text-sm text-gray-600">
          <p>Fill in the blanks ({settings.blanks.length} total)</p>
          {Object.keys(answers).length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Progress: {Object.values(answers).filter(a => a && a.trim()).length}/{settings.blanks.length} completed
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default ClozeForm