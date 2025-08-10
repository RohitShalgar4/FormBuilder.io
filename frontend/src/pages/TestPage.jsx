import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import CategorizePreview from '../components/previews/CategorizePreview'
import ClozePreview from '../components/previews/ClozePreview'
import CategorizeForm from '../components/forms/CategorizeForm'
import ClozeForm from '../components/forms/ClozeForm'

const TestPage = () => {
  const { param } = useParams()
  const [categorizeAnswer, setCategorizeAnswer] = useState({})
  const [clozeAnswer, setClozeAnswer] = useState({})

  // Test data for categorize
  const categorizeQuestion = {
    id: 'test-categorize',
    type: 'categorize',
    title: 'Test Categorize Question',
    settings: {
      categories: ['Animals', 'Colors'],
      items: ['Dog', 'Cat', 'Red', 'Blue', 'Bird', 'Green'],
      correctAnswers: {},
      itemScores: {},
      maxScore: 6
    }
  }

  // Test data for cloze
  const clozeQuestion = {
    id: 'test-cloze',
    type: 'cloze',
    title: 'Test Cloze Question',
    settings: {
      text: 'The quick [brown] fox jumps over the [lazy] dog.',
      blanks: ['brown', 'lazy'],
      correctAnswers: {},
      blankScores: {},
      maxScore: 2
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Drag and Drop Test</h1>
        
        {/* Categorize Preview Test */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Categorize Preview Test</h2>
          <CategorizePreview question={categorizeQuestion} preview={true} />
        </div>

        {/* Categorize Form Test */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Categorize Form Test</h2>
          <CategorizeForm 
            question={categorizeQuestion} 
            answer={categorizeAnswer}
            onChange={setCategorizeAnswer}
          />
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm font-medium">Current Answer:</p>
            <pre className="text-xs mt-1">{JSON.stringify(categorizeAnswer, null, 2)}</pre>
          </div>
        </div>

        {/* Cloze Preview Test */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cloze Preview Test</h2>
          <ClozePreview question={clozeQuestion} preview={true} />
        </div>

        {/* Cloze Form Test */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cloze Form Test</h2>
          <ClozeForm 
            question={clozeQuestion} 
            answer={clozeAnswer}
            onChange={setClozeAnswer}
          />
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm font-medium">Current Answer:</p>
            <pre className="text-xs mt-1">{JSON.stringify(clozeAnswer, null, 2)}</pre>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Try dragging items to categories in both preview and form tests</li>
            <li>• Try dragging words to fill blanks in both preview and form tests</li>
            <li>• Check if items/words stay in place after dropping</li>
            <li>• Check the "Current Answer" sections to see if state is updating</li>
            <li>• Open browser console to see debug logs</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TestPage
