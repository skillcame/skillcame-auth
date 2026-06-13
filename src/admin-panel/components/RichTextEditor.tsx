import { useState, useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered,
  Link,
  Image as ImageIcon,
  Video,
  Code,
  Smile,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Quote,
  Minus,
  Type,
  Strikethrough,
  Superscript,
  Subscript,
  Indent,
  Outdent,
  Maximize2,
  Minimize2,
  Save
} from 'lucide-react'

/**
 * Rich Text Editor Component
 * Supports: Bold, Italic, Underline, Headings, Lists, Links, Images, Videos, Colors, Emojis
 */
const RichTextEditor = ({ value = '', onChange, placeholder = 'Start typing...' }) => {
  const editorRef = useRef(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current && onChange) {
      // Get clean HTML content
      let content = editorRef.current.innerHTML
      
      // Fix any RTL issues by ensuring proper direction
      if (content) {
        // Remove any RTL direction attributes that might cause issues
        content = content.replace(/dir=["']rtl["']/gi, 'dir="ltr"')
        // Ensure proper text direction
        if (!content.includes('dir=')) {
          // Add ltr direction to root if not present
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = content
          tempDiv.setAttribute('dir', 'ltr')
          content = tempDiv.innerHTML
        }
      }
      
      onChange(content)
    }
  }

  const handleImageInsert = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      execCommand('insertImage', url)
    }
  }

  const handleLinkInsert = () => {
    const url = prompt('Enter link URL:')
    const text = prompt('Enter link text:', url)
    if (url && text) {
      execCommand('createLink', url)
    }
  }

  const handleVideoInsert = () => {
    const url = prompt('Enter video URL (YouTube/Vimeo):')
    if (url) {
      const videoHTML = `<iframe src="${url}" width="560" height="315" frameborder="0" allowfullscreen></iframe><br>`
      execCommand('insertHTML', videoHTML)
    }
  }

  const colors = [
    '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700', '#FFA500'
  ]

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']

  // Initialize editor content and fix direction
  useEffect(() => {
    if (editorRef.current) {
      // Clean the value to remove any RTL attributes
      let cleanValue = value || ''
      if (cleanValue) {
        // Remove any RTL direction attributes
        cleanValue = cleanValue.replace(/dir=["']rtl["']/gi, '')
        cleanValue = cleanValue.replace(/style="[^"]*direction:\s*rtl[^"]*"/gi, '')
        // Wrap in a div with explicit LTR if it's HTML
        if (cleanValue.includes('<')) {
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = cleanValue
          tempDiv.setAttribute('dir', 'ltr')
          tempDiv.style.direction = 'ltr'
          tempDiv.style.textAlign = 'left'
          cleanValue = tempDiv.innerHTML
        }
      }
      
      // Only update if content is different to avoid cursor jumping
      if (editorRef.current.innerHTML !== cleanValue) {
        const selection = window.getSelection()
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
        const cursorPosition = range ? range.startOffset : 0
        
        editorRef.current.innerHTML = cleanValue || ''
        
        // Ensure LTR direction
        editorRef.current.setAttribute('dir', 'ltr')
        editorRef.current.style.direction = 'ltr'
        editorRef.current.style.textAlign = 'left'
        editorRef.current.style.unicodeBidi = 'normal'
        
        // Restore cursor position if possible
        if (range && editorRef.current.firstChild) {
          try {
            const newRange = document.createRange()
            newRange.setStart(editorRef.current.firstChild, Math.min(cursorPosition, editorRef.current.firstChild.textContent?.length || 0))
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)
          } catch (e) {
            // Ignore cursor restoration errors
          }
        }
      }
    }
  }, [value])

  // Fix direction on focus
  const handleFocus = () => {
    if (editorRef.current) {
      editorRef.current.setAttribute('dir', 'ltr')
      editorRef.current.style.direction = 'ltr'
      editorRef.current.style.textAlign = 'left'
    }
  }

  return (
    <div className={`space-y-2 ${isFullscreen ? 'fixed inset-0 z-[100] bg-black p-4' : ''}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 md:gap-2 p-2 bg-black/50 border-2 border-indigo-600/30 rounded-lg">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Bold"
          >
            <Bold className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Italic"
          >
            <Italic className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Underline"
          >
            <Underline className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('superscript')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Superscript"
          >
            <Superscript className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('subscript')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Subscript"
          >
            <Subscript className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h1>')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h2>')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h3>')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Bullet List"
          >
            <List className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Media */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={handleLinkInsert}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Insert Link"
          >
            <Link className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={handleImageInsert}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={handleVideoInsert}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Insert Video"
          >
            <Video className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<pre>')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Code Block"
          >
            <Code className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Additional Formatting */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Quote"
          >
            <Quote className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertHorizontalRule')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Horizontal Line"
          >
            <Minus className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Remove Formatting"
          >
            <Type className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Indent/Outdent */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={() => execCommand('outdent')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Decrease Indent"
          >
            <Outdent className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('indent')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Increase Indent"
          >
            <Indent className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={() => execCommand('undo')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Undo"
          >
            <Undo className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('redo')}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title="Redo"
          >
            <Redo className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <div className="flex items-center space-x-1 border-r border-indigo-600/20 pr-2">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-white" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Color & Emoji */}
        <div className="flex items-center space-x-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
              title="Text Color"
            >
              <Palette className="w-4 h-4 text-white" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-lg z-10">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        execCommand('foreColor', color)
                        setShowColorPicker(false)
                      }}
                      className="w-6 h-6 rounded border border-gray-600"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 md:p-2 hover:bg-indigo-600/20 rounded transition-all"
              title="Insert Emoji"
            >
              <Smile className="w-4 h-4 text-white" />
            </button>
            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-lg z-10 max-h-48 overflow-y-auto custom-scrollbar w-64">
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        execCommand('insertText', emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="text-lg hover:bg-indigo-600/20 rounded p-1 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        dir="ltr"
        onInput={updateContent}
        onBlur={updateContent}
        onFocus={handleFocus}
        suppressContentEditableWarning
        className={`${isFullscreen ? 'min-h-[calc(100vh-200px)]' : 'min-h-[300px] md:min-h-[400px]'} px-3 md:px-4 py-2 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700] focus:ring-4 focus:ring-[#FFD700]/20 transition-all overflow-y-auto custom-scrollbar prose prose-invert max-w-none`}
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'normal'
        }}
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #6b7280;
          pointer-events: none;
        }
        [contenteditable] {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
        }
        [contenteditable] * {
          direction: ltr !important;
          text-align: left !important;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px 0;
        }
        [contenteditable] iframe {
          max-width: 100%;
          display: block;
          margin: 10px 0;
        }
        [contenteditable] h1, [contenteditable] h2, [contenteditable] h3 {
          direction: ltr !important;
          text-align: left !important;
          margin: 10px 0;
        }
        [contenteditable] p {
          direction: ltr !important;
          text-align: left !important;
          margin: 5px 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          direction: ltr !important;
          text-align: left !important;
          margin: 10px 0;
          padding-left: 30px;
        }
        [contenteditable] li {
          direction: ltr !important;
          text-align: left !important;
        }
        [contenteditable] pre, [contenteditable] code {
          direction: ltr !important;
          text-align: left !important;
          font-family: 'Courier New', monospace;
          background: rgba(255, 255, 255, 0.1);
          padding: 5px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor

