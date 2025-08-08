  import React from 'react'
  import { Plus, Trash2 } from 'lucide-react'

  const CategorizeEditor = ({ question, onUpdate }) => {
    const { settings } = question

    const addCategory = () => {
      const newCategories = [...settings.categories, `Category ${settings.categories.length + 1}`]
      onUpdate({
        settings: { ...settings, categories: newCategories }
      })
    }

    const updateCategory = (index, value) => {
      const newCategories = [...settings.categories]
      newCategories[index] = value
      onUpdate({
        settings: { ...settings, categories: newCategories }
      })
    }

    const removeCategory = (index) => {
      const newCategories = settings.categories.filter((_, i) => i !== index)
      onUpdate({
        settings: { ...settings, categories: newCategories }
      })
    }

    const addItem = () => {
      const newItems = [...settings.items, `Item ${settings.items.length + 1}`]
      onUpdate({
        settings: { ...settings, items: newItems }
      })
    }

    const updateItem = (index, value) => {
      const newItems = [...settings.items]
      newItems[index] = value
      onUpdate({
        settings: { ...settings, items: newItems }
      })
    }

    const removeItem = (index) => {
      const newItems = settings.items.filter((_, i) => i !== index)
      onUpdate({
        settings: { ...settings, items: newItems }
      })
    }

    const updateItemCategory = (itemIndex, categoryIndex) => {
      const newCorrectAnswers = { ...settings.correctAnswers }
      newCorrectAnswers[itemIndex] = categoryIndex
      onUpdate({
        settings: { ...settings, correctAnswers: newCorrectAnswers }
      })
    }

    const updateMaxScore = (maxScore) => {
      onUpdate({
        settings: { ...settings, maxScore: parseInt(maxScore) || 0 }
      })
    }

    const updateItemScore = (itemIndex, score) => {
      const newItemScores = { ...settings.itemScores }
      newItemScores[itemIndex] = parseInt(score) || 1
      onUpdate({
        settings: { ...settings, itemScores: newItemScores }
      })
    }

    // Calculate total max score
    const totalMaxScore = settings.items?.reduce((sum, _, index) => {
      return sum + (settings.itemScores?.[index] || 1)
    }, 0) || 0

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
            value={settings.maxScore || totalMaxScore}
            onChange={(e) => updateMaxScore(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter maximum score"
          />
          <p className="text-xs text-gray-500 mt-1">
            Total score from all items: {totalMaxScore}
          </p>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Categories</h4>
            <button
              onClick={addCategory}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus size={16} />
              Add Category
            </button>
          </div>
          <div className="space-y-2">
            {settings.categories.map((category, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => updateCategory(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={`Category ${index + 1}`}
                />
                {settings.categories.length > 2 && (
                  <button
                    onClick={() => removeCategory(index)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Items to Categorize</h4>
            <button
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
          <div className="space-y-4">
            {settings.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Item ${index + 1}`}
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Correct Category Selection */}
                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Correct Category:
                  </label>
                  <select
                    value={settings.correctAnswers?.[index] ?? ''}
                    onChange={(e) => updateItemCategory(index, parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select correct category</option>
                    {settings.categories.map((category, catIndex) => (
                      <option key={catIndex} value={catIndex}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Score */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Item Score:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.itemScores?.[index] || 1}
                    onChange={(e) => updateItemScore(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter item score"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categories */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Categories:</p>
              <div className="space-y-2">
                {settings.categories.map((category, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[60px]"
                  >
                    <p className="font-medium text-gray-900">{category}</p>
                    <p className="text-xs text-gray-500">Drop items here</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Items */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Items:</p>
              <div className="space-y-2">
                {settings.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-2 bg-primary-100 border border-primary-300 rounded-lg cursor-move"
                  >
                    <p className="text-primary-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  export default CategorizeEditor