import React, { useState, useEffect } from 'react'
import AdminLayout from './components/AdminLayout'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { 
  watchDashboardCards, 
  createDashboardCard, 
  updateDashboardCard, 
  deleteDashboardCard,
  getAllDashboardCards
} from '../services/admin/DashboardCardManager'
import { toast } from '../components/Toast'

const DashboardCardManager = () => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCard, setEditingCard] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    titleColor: '#ffffff',
    description: '',
    descriptionColor: 'rgba(255, 255, 255, 0.9)',
    buttonText: '',
    buttonColor: '#ffffff',
    buttonUrl: '',
    bgColor: '#1a1a1a',
    svgIcon: '',
    priority: 0,
    expireDateTime: '',
    isActive: true
  })

  // Watch cards in real-time
  useEffect(() => {
    const unsubscribe = watchDashboardCards((cardsData) => {
      setCards(cardsData || [])
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      titleColor: '#ffffff',
      description: '',
      descriptionColor: 'rgba(255, 255, 255, 0.9)',
      buttonText: '',
      buttonColor: '#ffffff',
      buttonUrl: '',
      bgColor: '#1a1a1a',
      svgIcon: '',
      priority: cards.length,
      expireDateTime: '',
      isActive: true
    })
    setEditingCard(null)
    setShowForm(false)
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.buttonText.trim() || !formData.buttonUrl.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingCard) {
        // Update existing card
        const result = await updateDashboardCard(editingCard.id, formData)
        if (result.success) {
          toast.success('Card updated successfully')
          resetForm()
        } else {
          toast.error(result.error || 'Failed to update card')
        }
      } else {
        // Create new card
        const result = await createDashboardCard(formData)
        if (result.success) {
          toast.success('Card created successfully')
          resetForm()
        } else {
          toast.error(result.error || 'Failed to create card')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error('Error saving card:', error)
    }
  }

  // Handle edit
  const handleEdit = (card) => {
    setEditingCard(card)
    
    // Convert expireDateTime from timestamp to datetime-local format
    let expireDateTime = ''
    if (card.expireDateTime) {
      const expireDate = typeof card.expireDateTime === 'number' 
        ? new Date(card.expireDateTime)
        : new Date(card.expireDateTime)
      if (!isNaN(expireDate.getTime())) {
        expireDateTime = expireDate.toISOString().slice(0, 16) // Format for datetime-local input
      }
    }
    
    setFormData({
      title: card.title || '',
      titleColor: card.titleColor || '#ffffff',
      description: card.description || '',
      descriptionColor: card.descriptionColor || 'rgba(255, 255, 255, 0.9)',
      buttonText: card.buttonText || '',
      buttonColor: card.buttonColor || '#ffffff',
      buttonUrl: card.buttonUrl || '',
      bgColor: card.bgColor || '#1a1a1a',
      svgIcon: card.svgIcon || '',
      priority: card.priority !== undefined ? card.priority : (card.order || 0),
      expireDateTime: expireDateTime,
      isActive: card.isActive !== false
    })
    setShowForm(true)
  }

  // Handle delete
  const handleDelete = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return
    }

    try {
      const result = await deleteDashboardCard(cardId)
      if (result.success) {
        toast.success('Card deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete card')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error('Error deleting card:', error)
    }
  }

  // Handle order change (priority change)
  const handleOrderChange = async (cardId, direction) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const currentPriority = card.priority !== undefined ? card.priority : (card.order || 0)
    const newPriority = direction === 'up' ? currentPriority + 1 : Math.max(0, currentPriority - 1)

    // Find card with target priority
    const targetCard = cards.find(c => {
      const cPriority = c.priority !== undefined ? c.priority : (c.order || 0)
      return cPriority === newPriority && c.id !== cardId
    })
    
    if (targetCard) {
      // Swap priorities
      const targetPriority = targetCard.priority !== undefined ? targetCard.priority : (targetCard.order || 0)
      await Promise.all([
        updateDashboardCard(cardId, { ...card, priority: newPriority, order: newPriority }),
        updateDashboardCard(targetCard.id, { ...targetCard, priority: currentPriority, order: currentPriority })
      ])
    } else {
      await updateDashboardCard(cardId, { ...card, priority: newPriority, order: newPriority })
    }
  }

  // Toggle active status
  const handleToggleActive = async (card) => {
    try {
      const result = await updateDashboardCard(card.id, {
        ...card,
        isActive: !card.isActive
      })
      if (result.success) {
        toast.success(`Card ${!card.isActive ? 'activated' : 'deactivated'}`)
      }
    } catch (error) {
      toast.error('Failed to update card status')
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dashboard Card Manager</h1>
            <p className="text-gray-400">Manage cards displayed on user dashboard</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Card</span>
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingCard ? 'Edit Card' : 'Create New Card'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                    placeholder="Enter card title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Title Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.titleColor}
                      onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                      className="w-16 h-12 rounded-lg border-2 border-indigo-600/30 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.titleColor}
                      onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                      className="flex-1 px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all resize-none"
                    placeholder="Enter card description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Description Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.descriptionColor}
                      onChange={(e) => setFormData({ ...formData, descriptionColor: e.target.value })}
                      className="w-16 h-12 rounded-lg border-2 border-indigo-600/30 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.descriptionColor}
                      onChange={(e) => setFormData({ ...formData, descriptionColor: e.target.value })}
                      className="flex-1 px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                      placeholder="rgba(255, 255, 255, 0.9)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Card Icon (Inline SVG or Image URL)
                  </label>
                  <textarea
                    value={formData.svgIcon}
                    onChange={(e) => setFormData({ ...formData, svgIcon: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 font-mono text-xs resize-none"
                    placeholder='e.g., <svg>...</svg> OR https://example.com/icon.png'
                    rows={2}
                  />
                  <p className="text-xs text-gray-400 mt-1">Paste a clean SVG string (starting with &lt;svg&gt;) or direct URL to an image/icon.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Button Text *
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                      placeholder="e.g., Get Started"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Button URL *
                    </label>
                    <input
                      type="text"
                      value={formData.buttonUrl}
                      onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                      placeholder="/user/courses or https://..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Button Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formData.buttonColor}
                        onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                        className="w-16 h-12 rounded-lg border-2 border-indigo-600/30 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.buttonColor}
                        onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                        className="flex-1 px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formData.bgColor}
                        onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                        className="w-16 h-12 rounded-lg border-2 border-indigo-600/30 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.bgColor}
                        onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                        className="flex-1 px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                        placeholder="#1a1a1a"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Priority (Higher = Shows First)
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                      min="0"
                    />
                    <p className="text-xs text-gray-400 mt-1">Cards with higher priority appear first in carousel</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Expiration Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expireDateTime}
                    onChange={(e) => setFormData({ ...formData, expireDateTime: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">Card will automatically disappear after this date/time. Leave empty for no expiration.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-indigo-600/30 text-lime-400 focus:ring-lime-400"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-300">
                    Card is active (visible on dashboard)
                  </label>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-black/50 rounded-xl border-2 border-indigo-600/20">
                  <p className="text-sm text-gray-400 mb-2">Preview:</p>
                  <div
                    className="h-32 rounded-lg flex flex-col justify-center items-center text-center p-4"
                    style={{ backgroundColor: formData.bgColor || '#1a1a1a' }}
                  >
                    <h3 className="text-lg font-bold text-white mb-2">{formData.title || 'Card Title'}</h3>
                    {formData.description && (
                      <p className="text-sm text-white/90 mb-3">{formData.description}</p>
                    )}
                    {formData.buttonText && (
                      <button className="px-4 py-2 bg-white text-black font-bold rounded-lg text-sm">
                        {formData.buttonText}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl transition-all flex items-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingCard ? 'Update Card' : 'Create Card'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cards List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl">
            <p className="text-gray-400 mb-4">No cards created yet</p>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl transition-all"
            >
              Create First Card
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`bg-[#1a1a1a] border-2 rounded-xl p-4 md:p-6 ${
                  card.isActive !== false
                    ? 'border-indigo-600/30'
                    : 'border-gray-700/30 opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1 flex items-start space-x-4">
                    <div className="flex flex-col items-center space-y-2 pt-2">
                    <button
                      onClick={() => handleOrderChange(card.id, 'up')}
                      className="p-1 rounded hover:bg-gray-800"
                      title="Increase Priority"
                    >
                      <ArrowUp className="w-4 h-4 text-gray-400" />
                    </button>
                    <GripVertical className="w-5 h-5 text-gray-500" />
                    <button
                      onClick={() => handleOrderChange(card.id, 'down')}
                      className="p-1 rounded hover:bg-gray-800"
                      title="Decrease Priority"
                    >
                      <ArrowDown className="w-4 h-4 text-gray-400" />
                    </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{card.title}</h3>
                        <span className="px-2 py-1 text-xs rounded-lg bg-indigo-600/20 text-indigo-400">
                          Order: {card.order || 0}
                        </span>
                        {card.isActive === false && (
                          <span className="px-2 py-1 text-xs rounded-lg bg-gray-700/50 text-gray-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      {card.description && (
                        <p className="text-gray-400 text-sm mb-2">{card.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Button: <strong className="text-white">{card.buttonText}</strong></span>
                        <span>URL: <strong className="text-white">{card.buttonUrl}</strong></span>
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border-2 border-gray-600"
                          style={{ backgroundColor: card.bgColor || '#1a1a1a' }}
                        />
                        <span className="text-xs text-gray-400">{card.bgColor || '#1a1a1a'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(card)}
                      className={`p-2 rounded-lg transition-colors ${
                        card.isActive !== false
                          ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                      }`}
                      title={card.isActive !== false ? 'Deactivate' : 'Activate'}
                    >
                      {card.isActive !== false ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(card)}
                      className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default DashboardCardManager

