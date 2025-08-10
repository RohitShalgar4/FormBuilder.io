import React from 'react'
import { useParams } from 'react-router-dom'

const TestPage = () => {
  const params = useParams()
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600 mb-4">This page is working correctly!</p>
        <div className="bg-gray-100 p-4 rounded-lg text-left">
          <h3 className="font-medium mb-2">URL Parameters:</h3>
          <pre className="text-sm text-gray-700">
            {JSON.stringify(params, null, 2)}
          </pre>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-left mt-4">
          <h3 className="font-medium mb-2">Current URL:</h3>
          <p className="text-sm text-gray-700">{window.location.href}</p>
        </div>
      </div>
    </div>
  )
}

export default TestPage
