"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Send, MoreVertical, ChevronDown, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { findMatchingResponse, getDefaultResponse } from "@/lib/chatbot-data"

// Function to convert URLs in text to clickable links
function renderMessageContent(content: string) {
  // Regular expression to match URLs (http, https, www., and domain patterns)
  // This regex matches:
  // - https://... or http://...
  // - www.example.com
  // - example.com with optional path (until whitespace or end of line)
  const urlRegex = /(https?:\/\/[^\s\n]+|www\.[^\s\n]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::[0-9]+)?(?:\/[^\s\n]*)?)/gi
  
  const parts: (string | JSX.Element)[] = []
  let lastIndex = 0
  let match
  let key = 0
  const matches: Array<{ index: number; url: string; display: string }> = []

  // First, collect all matches
  while ((match = urlRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      url: match[0],
      display: match[0]
    })
  }

  // If no URLs found, return original content as string
  if (matches.length === 0) {
    return <span>{content}</span>
  }

  // Build the parts array
  matches.forEach((matchItem) => {
    // Add text before the URL
    if (matchItem.index > lastIndex) {
      parts.push(content.substring(lastIndex, matchItem.index))
    }
    
    // Prepare the URL
    let url = matchItem.url
    // Remove trailing punctuation that might not be part of the URL
    url = url.replace(/[.,;:!?]+$/, '')
    const trailingPunctuation = matchItem.url.slice(url.length)
    
    // Add https:// if it starts with www.
    let href = url
    if (href.startsWith('www.')) {
      href = 'https://' + href
    } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
      // If it looks like a domain but doesn't have a protocol, add https://
      if (href.match(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/)) {
        href = 'https://' + href
      }
    }
    
    // Add the URL as a clickable link
    parts.push(
      <a
        key={`link-${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {matchItem.display}
      </a>
    )
    
    // Add trailing punctuation if any
    if (trailingPunctuation) {
      parts.push(trailingPunctuation)
    }
    
    lastIndex = matchItem.index + matchItem.url.length
  })
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }
  
  return <>{parts}</>
}

interface Message {
  id: string
  sender: "user" | "bot"
  content: string
  timestamp: string
  type?: "text" | "action"
  actionButton?: {
    text: string
    link: string
  }
}

const welcomeMessages: Message[] = [
  {
    id: "1",
    sender: "bot",
    content: "Welcome to Langkawi Port-Dermaga Tanjung Lembung.",
    timestamp: "12:00 PM",
    type: "text"
  },
  {
    id: "2",
    sender: "bot",
    content: "Hi! Our hours of operation are from 8:00 AM to 5:00 PM, during weekdays.\n\nVisit our website page to know more details.",
    timestamp: "12:00 PM",
    type: "action",
    actionButton: {
      text: "Visit Website",
      link: "https://langkawiport.com.my/"
    }
  }
]

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(welcomeMessages)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const formatTime = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userInput = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: userInput,
      timestamp: formatTime(),
      type: "text"
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Intelligent bot response based on knowledge base
    setTimeout(() => {
      const matchingResponse = findMatchingResponse(userInput)
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        content: matchingResponse || getDefaultResponse(),
        timestamp: formatTime(),
        type: "text"
      }
      setMessages((prev) => [...prev, botResponse])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Closed state - show floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full bg-black text-white shadow-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center group"
        aria-label="Open chatbot"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        {messages.filter((m) => m.sender === "bot").length > welcomeMessages.length && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
            1
          </span>
        )}
      </button>
    )
  }

  // Open state - show full chat window
  return (
    <div className="fixed bottom-8 right-8 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarFallback className="bg-white text-black font-bold text-sm">
              LP
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">Langkawi Port Support</p>
            <p className="text-xs text-gray-300">Online Customer Service</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-1 hover:bg-gray-800 rounded transition-colors" 
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Close chatbot"
            title="Close chat"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4">
        {/* Timestamp */}
        <div className="text-center text-xs text-gray-500 py-2">
          {formatTime()}
        </div>

        {messages.map((message) => (
          <div key={message.id} className="space-y-1">
            {message.sender === "bot" && (
              <div className="text-xs text-gray-600 mb-1">Langkawi Port Support</div>
            )}
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[85%]",
                message.sender === "user"
                  ? "bg-blue-500 text-white ml-auto text-right"
                  : "bg-gray-100 text-gray-800"
              )}
            >
              <div className="text-sm whitespace-pre-wrap">
                {message.sender === "bot" ? (
                  renderMessageContent(message.content)
                ) : (
                  message.content
                )}
              </div>
              {message.type === "action" && message.actionButton && (
                <button
                  className="mt-3 w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  onClick={() => window.open(message.actionButton?.link, "_blank")}
                >
                  {message.actionButton.text}
                </button>
              )}
            </div>
            <div
              className={cn(
                "text-xs text-gray-500",
                message.sender === "user" ? "text-right" : ""
              )}
            >
              {message.timestamp}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {input && (
          <div className="flex items-center gap-1 text-blue-500">
            <div className="flex gap-1 bg-gray-100 rounded-lg px-3 py-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="flex-1 border-gray-300 rounded-lg focus:border-blue-500"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-black hover:bg-gray-800 text-white rounded-lg"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}



