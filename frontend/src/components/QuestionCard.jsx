import React, { useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { GripVertical, Trash2, Image, Settings, Eye, EyeOff } from 'lucide-react'

import CategorizeEditor from './questions/CategorizeEditor'
import ClozeEditor from './questions/ClozeEditor'
import ComprehensionEditor from './questions/ComprehensionEditor'
import ImageUpload from './ImageUpload'

const QuestionCard = ({ question, index, onUpdate, onDelete, onMove }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'QUESTION',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const [, drop] = useDrop(() => ({
    accept: 'QUESTION',
    hover: (item) => {
      if (item.index !== index) {
        onMove(item.index, index)
        item.index = index
      }
    },
  }))

  const handleImageUpload = (imageUrl) => {
    onUpdate(question.id, { image: imageUrl })
    setShowImageUpload(false)
  }

  const renderEditor = () => {
    switch (question.type) {
      case 'categorize':
        return (
          <CategorizeEditor
            question={question}
            onUpdate={(updates) => onUpdate(question.id, updates)}
          />
        )
      case 'cloze':
        return (
          <ClozeEditor
            question={question}
            onUpdate={(updates) => onUpdate(question.id, updates)}
          />
        )
      case 'comprehension':
        return (
          <ComprehensionEditor
            question={question}
            onUpdate={(updates) => onUpdate(question.id, updates)}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <div
        ref={(node) => drag(drop(node))}
        className={`question-card ${isDragging ? 'opacity-50' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="drag-handle">
              <GripVertical size={20} />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={question.title}
                onChange={(e) => onUpdate(question.id, { title: e.target.value })}
                className="text-lg font-medium bg-transparent border-none outline-none focus:bg-gray-50 focus:border focus:border-gray-300 focus:rounded px-2 py-1 w-full"
                placeholder="Question Title"
              />
              <input
                type="text"
                value={question.description || ''}
                onChange={(e) => onUpdate(question.id, { description: e.target.value })}
                className="text-sm text-gray-600 bg-transparent border-none outline-none focus:bg-gray-50 focus:border focus:border-gray-300 focus:rounded px-2 py-1 w-full mt-1"
                placeholder="Question Description (optional)"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImageUpload(true)}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Add Image"
            >
              <Image size={18} />
            </button>
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate(question.id, { required: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Required
            </label>

            <button
              onClick={() => onDelete(question.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Question Image */}
        {question.image && (
          <div className="mb-4">
            <img
              src={`http://localhost:8080${question.image}`}
              alt="Question"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Question Editor */}
        {!collapsed && (
          <div className="mt-4">
            {renderEditor()}
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUpload
          onUpload={handleImageUpload}
          onClose={() => setShowImageUpload(false)}
          title="Upload Question Image"
        />
      )}
    </>
  )
}

export default QuestionCard