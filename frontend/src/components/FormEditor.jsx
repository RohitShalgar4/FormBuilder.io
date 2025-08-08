import React from 'react'
import { useDrop } from 'react-dnd'
import { v4 as uuidv4 } from 'uuid'

import QuestionCard from './QuestionCard'
import DropZone from './DropZone'

const FormEditor = ({ form, setForm }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'QUESTION_TYPE',
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        addQuestion(item.type)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }))

  const addQuestion = (type) => {
    const newQuestion = {
      id: uuidv4(),
      type,
      title: getDefaultTitle(type),
      description: '',
      image: '',
      required: false,
      settings: getDefaultSettings(type)
    }

    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const getDefaultTitle = (type) => {
    switch (type) {
      case 'categorize': return 'Categorize Question'
      case 'cloze': return 'Cloze Question'
      case 'comprehension': return 'Comprehension Question'
      default: return 'New Question'
    }
  }

  const getDefaultSettings = (type) => {
    switch (type) {
      case 'categorize':
        return {
          categories: ['Category 1', 'Category 2'],
          items: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
          correctAnswers: {},
          itemScores: {},
          maxScore: 4
        }
      case 'cloze':
        return {
          text: 'The quick [brown] fox jumps over the [lazy] dog.',
          blanks: ['brown', 'lazy'],
          correctAnswers: {},
          blankScores: {},
          maxScore: 2
        }
      case 'comprehension':
        return {
          passage: 'Write your passage here...',
          questions: [{
            question: 'Sample question?',
            options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            correctAnswer: 0,
            score: 1
          }],
          maxScore: 1
        }
      default:
        return {}
    }
  }

  const updateQuestion = (questionId, updates) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }))
  }

  const deleteQuestion = (questionId) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }))
  }

  const moveQuestion = (dragIndex, hoverIndex) => {
    setForm(prev => {
      const newQuestions = [...prev.questions]
      const draggedQuestion = newQuestions[dragIndex]
      newQuestions.splice(dragIndex, 1)
      newQuestions.splice(hoverIndex, 0, draggedQuestion)
      return { ...prev, questions: newQuestions }
    })
  }

  return (
    <div ref={drop} className={`min-h-96 ${isOver ? 'bg-primary-50' : ''} transition-colors rounded-lg`}>
      {/* Header Image */}
      {form.headerImage && (
        <div className="mb-6">
          <img
            src={`http://localhost:8080${form.headerImage}`}
            alt="Form Header"
            className="w-full h-48 object-cover rounded-lg shadow-sm"
          />
        </div>
      )}

      {/* Form Title and Description */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
        {form.description && (
          <p className="text-gray-600">{form.description}</p>
        )}
      </div>

      {/* Questions */}
      {form.questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          index={index}
          onUpdate={updateQuestion}
          onDelete={deleteQuestion}
          onMove={moveQuestion}
        />
      ))}

      {/* Drop Zone */}
      <DropZone 
        onDrop={addQuestion}
        isEmpty={form.questions.length === 0}
      />
    </div>
  )
}

export default FormEditor