import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Users, Calendar, FileText, Eye, Shield, BarChart3, Clock, ExternalLink } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const FormResponses = () => {
  const { formId } = useParams()
  const [form, setForm] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportingAll, setExportingAll] = useState(false)
  const [exportingSingle, setExportingSingle] = useState({})

  useEffect(() => {
    fetchFormData()
  }, [formId])

  const fetchFormData = async () => {
    try {
      const [formResponse, responsesResponse] = await Promise.all([
        axios.get(`/api/forms/${formId}`),
        axios.get(`/api/responses/form/${formId}`)
      ])
      setForm(formResponse.data)
      setResponses(responsesResponse.data)
      
      // Debug logging
      console.log('Form data:', formResponse.data)
      console.log('Responses data:', responsesResponse.data)
      responsesResponse.data.forEach((response, index) => {
        const userInfo = getUserInfo(response)
        console.log(`Response ${index}:`, {
          id: response._id,
          userId: userInfo.isAuthenticated ? 'Authenticated' : 'Anonymous',
          userName: userInfo.name,
          userEmail: userInfo.email,
          userRole: userInfo.role,
          isAuthenticated: userInfo.isAuthenticated,
          submittedAt: response.submittedAt,
          answersCount: response.answers?.length || 0,
          ipAddress: response.ipAddress
        })
      })
    } catch (error) {
      console.error('Error fetching form data:', error)
      toast.error('Failed to fetch form data')
    } finally {
      setLoading(false)
    }
  }

  const exportResponses = async () => {
    setExportingAll(true)
    try {
      console.log('📊 Starting export for form:', formId);
      
      const response = await axios.get(`/api/responses/export/${formId}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${form?.title || 'form'}-responses-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url)
      
      console.log('✅ Export completed successfully')
      toast.success('Responses exported successfully!')
    } catch (error) {
      console.error('❌ Export error:', error)
      if (error.response?.status === 404) {
        toast.error('Form not found')
      } else if (error.response?.status === 403) {
        toast.error('Access denied')
      } else {
        toast.error('Failed to export responses')
      }
    } finally {
      setExportingAll(false)
    }
  }

  const exportSingleResponse = async (responseId) => {
    setExportingSingle(prev => ({ ...prev, [responseId]: true }))
    try {
      console.log('📊 Starting single response export:', responseId)
      
      const response = await axios.get(`/api/responses/export-single/${responseId}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      // Ensure responseId is a string and get last 8 characters
      const responseIdStr = responseId.toString()
      link.setAttribute('download', `response-${responseIdStr.slice(-8)}-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url)
      
      console.log('✅ Single response export completed successfully')
      toast.success('Response exported successfully!')
    } catch (error) {
      console.error('❌ Single response export error:', error)
      if (error.response?.status === 404) {
        toast.error('Response not found')
      } else if (error.response?.status === 403) {
        toast.error('Access denied')
      } else {
        toast.error('Failed to export response')
      }
    } finally {
      setExportingSingle(prev => ({ ...prev, [responseId]: false }))
    }
  }

  const calculateScore = (response) => {
    // Use the stored score from the response if available
    if (response.score !== undefined && response.maxScore !== undefined) {
      return response.maxScore > 0 ? Math.round((response.score / response.maxScore) * 100) : 0;
    }
    
    // Fallback to old calculation method for backward compatibility
    if (!form || !response.answers) return 0
    
    let totalQuestions = 0
    let correctAnswers = 0
    
    form.questions.forEach(question => {
      if (question.type === 'comprehension') {
        totalQuestions++
        const answer = response.answers.find(a => a.questionId === question.id)
        if (answer && answer.answer) {
          // Check if the selected option matches the correct answer
          const selectedOption = answer.answer[0] // Assuming first question
          if (selectedOption === question.settings?.questions?.[0]?.correctAnswer) {
            correctAnswers++
          }
        }
      }
    })
    
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  }

  const getUserDisplayName = (response) => {
    if (response.userId && response.userId.name) {
      return response.userId.name
    }
    return 'Anonymous'
  }

  const getUserEmail = (response) => {
    if (response.userId && response.userId.email) {
      return response.userId.email
    }
    return 'Anonymous'
  }

  const getUserInfo = (response) => {
    // Use the enhanced userInfo from backend if available
    if (response.userInfo) {
      return {
        name: response.userInfo.name,
        email: response.userInfo.email,
        role: response.userInfo.role,
        isAuthenticated: response.userInfo.isAuthenticated
      }
    }
    
    // Fallback to old structure
    if (response.userId && response.userId._id) {
      return {
        name: response.userId.name || 'Anonymous',
        email: response.userId.email || 'Anonymous',
        role: response.userId.role || 'user',
        isAuthenticated: true
      }
    }
    return {
      name: 'Anonymous',
      email: 'Anonymous',
      role: 'anonymous',
      isAuthenticated: false
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form not found</h2>
          <p className="text-gray-600 mb-4">The form you're looking for doesn't exist.</p>
          <Link to="/admin" className="btn-primary">
            Back to Forms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Form Responses</h1>
                <p className="text-gray-600 mt-1">{form.title || 'Untitled Form'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
            <button
              onClick={exportResponses}
              className="btn-primary flex items-center gap-2"
              disabled={responses.length === 0 || exportingAll}
            >
              {exportingAll ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Download size={20} />
              )}
              {exportingAll ? 'Exporting...' : 'Export All'}
            </button>
            <Link
              to={`/form/${form.shareId}`}
              className="btn-secondary flex items-center gap-2"
              target="_blank"
            >
              <ExternalLink size={20} />
              View Form
            </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
              {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {responses.length > 0 
                    ? Math.round(responses.reduce((sum, response) => sum + calculateScore(response), 0) / responses.length)
                    : 0}%
                </p>
                {responses.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {responses.reduce((sum, response) => sum + (response.score || 0), 0)} total points
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Authenticated Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {responses.filter(response => {
                    const userInfo = getUserInfo(response);
                    return userInfo.isAuthenticated;
                  }).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Anonymous Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {responses.filter(response => {
                    const userInfo = getUserInfo(response);
                    return !userInfo.isAuthenticated;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Responses */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Responses</h2>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
              <p className="text-gray-600 mb-6">Share the form link to start receiving responses</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-sm text-gray-500">Share link:</span>
                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                  {`${window.location.origin}/form/${form.shareId}`}
                </code>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {responses.map((response, index) => {
                    const dateTime = formatDateTime(response.submittedAt)
                    const score = calculateScore(response)
                    const userInfo = getUserInfo(response)
                    
                    return (
                      <tr key={response._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">{userInfo.name}</div>
                              {userInfo.isAuthenticated && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Authenticated
                                </span>
                              )}
                              {!userInfo.isAuthenticated && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Anonymous
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{userInfo.email}</div>
                            {userInfo.role && userInfo.role !== 'anonymous' && (
                              <div className="text-xs text-gray-400 capitalize">
                                Role: {userInfo.role}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div className="font-medium">{dateTime.date}</div>
                            <div className="text-xs text-gray-400">{dateTime.time}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              score >= 80 ? 'bg-green-100 text-green-800' :
                              score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {score}%
                            </span>
                            {response.score !== undefined && response.maxScore !== undefined && (
                              <div className="text-xs text-gray-500 mt-1">
                                {response.score}/{response.maxScore} points
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/response-detail/${response._id}`}
                              className="text-primary-600 hover:text-primary-900 font-medium"
                            >
                              View
                            </Link>
                                                      <button
                            onClick={() => exportSingleResponse(response._id)}
                            className="text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50"
                            disabled={exportingSingle[response._id]}
                          >
                            {exportingSingle[response._id] ? 'Exporting...' : 'Export'}
                          </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormResponses