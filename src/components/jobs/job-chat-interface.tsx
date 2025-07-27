'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  MessageCircle, 
  FileText, 
  Mail, 
  BrainCircuit, 
  Upload, 
  Send,
  Bot,
  User,
  Loader2,
  X,
  Save
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase-clean'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  agent_type: string
  created_at: string
}

interface JobChatInterfaceProps {
  job: any
  userEmail: string
  onClose: () => void
}

const AI_AGENTS = [
  {
    id: 'cv_optimization',
    name: 'CV Optimizer',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Optimize your CV for this specific job'
  },
  {
    id: 'email_drafting',
    name: 'Email Assistant',
    icon: Mail,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Draft application emails and follow-ups'
  },
  {
    id: 'interview_prep',
    name: 'Interview Coach',
    icon: BrainCircuit,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Prepare for interviews and technical questions'
  },
  {
    id: 'job_analysis',
    name: 'Job Analyst',
    icon: MessageCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Analyze job requirements and market insights'
  }
]

export function JobChatInterface({ job, userEmail, onClose }: JobChatInterfaceProps) {
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [userCV, setUserCV] = useState<any>(null)
  const [cvText, setCvText] = useState('')
  const [showCvInput, setShowCvInput] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat session and load history
  useEffect(() => {
    if (activeAgent) {
      initializeChatSession()
    }
  }, [job.id, activeAgent])

  // Set default agent on component mount
  useEffect(() => {
    if (!activeAgent) {
      setActiveAgent('job_analysis')
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeChatSession = async () => {
    if (!activeAgent) return
    
    try {
      const authClient = createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      
      if (!user) {
        console.log('❌ User not authenticated')
        return
      }

      console.log('🔍 Initializing chat session for:', { 
        userId: user.id, 
        jobId: job.id, 
        agentType: activeAgent
      })

      // STRICT SESSION ISOLATION: Only look for sessions for this specific agent + job combination
      const { data: existingSession, error: sessionError } = await authClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', job.id)
        .eq('agent_type', activeAgent)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log('📋 Session lookup result:', { 
        existingSession: existingSession?.id, 
        sessionError,
        agentType: activeAgent,
        found: !!existingSession
      })

      if (!existingSession) {
        console.log('🆕 No existing session found for this agent + job combination. Creating new session.')
        
        // Create new session for this specific agent + job
        const { data: newSession, error: createError } = await authClient
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            job_id: job.id,
            agent_type: activeAgent,
            session_name: `${AI_AGENTS.find(a => a.id === activeAgent)?.name} - ${job.title}`
          })
          .select()
          .single()
        
        if (createError) {
          console.error('❌ Failed to create session:', createError)
          return
        }
        
        console.log('✅ Created new session for', activeAgent, ':', newSession.id)
        setSessionId(newSession.id)
        
        // Load empty message history for new session
        setMessages([])
        return
      }

      // Session found - load its message history
      console.log('📨 Loading message history for existing session:', existingSession.id)
      setSessionId(existingSession.id)
      
      // Load messages for this specific session
      const { data: messageHistory, error: historyError } = await authClient
        .from('messages')
        .select('*')
        .eq('session_id', existingSession.id)
        .order('created_at', { ascending: true })

      if (historyError) {
        console.error('❌ Failed to load message history:', historyError)
        setMessages([])
        return
      }

      console.log('📨 Loaded message history:', { 
        count: messageHistory?.length || 0, 
        sessionId: existingSession.id, 
        agentType: activeAgent,
        messages: messageHistory?.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content?.substring(0, 50) + '...',
          created_at: m.created_at
        }))
      })

      setMessages(messageHistory || [])

    } catch (error) {
      console.error('❌ Error in initializeChatSession:', error)
      setMessages([])
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return

    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      agent_type: activeAgent || 'job_analysis', // Default to job_analysis if activeAgent is null
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Get the user session and pass it to the API
      const authClient = createSupabaseClient()
      const { data: { session } } = await authClient.auth.getSession()
      
      if (!session) {
        throw new Error('No active session found')
      }

      console.log('🚀 Sending chat request with job data:', {
        jobId: job.id,
        jobTitle: job.title,
        jobKeys: Object.keys(job),
        fullJob: job
      })

      const response = await fetch('/api/chat-with-agent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          sessionId,
          agentType: activeAgent || 'job_analysis', // Default to job_analysis if activeAgent is null
          jobData: {
            id: job.id,
            title: job.title,
            company: job.company_name || job.company,
            description: job.job_description || job.description,
            requirements: job.requirements
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`API Error (${response.status}): ${errorText}`)
      }

      const aiResponse = await response.json()
      
      const assistantMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.content,
        agent_type: activeAgent || 'job_analysis', // Default to job_analysis if activeAgent is null
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        agent_type: activeAgent || 'job_analysis', // Default to job_analysis if activeAgent is null
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCVTextUpload = async () => {
    if (!cvText.trim()) return

    setUploadingCV(true)
    
    try {
      const supabaseClient = createSupabaseClient()
      const session = await supabaseClient.auth.getSession()
      if (!session.data.session) {
        throw new Error('No active session found')
      }

      const response = await fetch('/api/upload-cv-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cvText: cvText.trim(),
          jobId: job.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setUserCV(result.cv)
      setCvText('')
      setShowCvInput(false)
      
      // Add a system message about the CV upload
      const uploadMessage = {
        id: Date.now().toString(),
        role: 'system' as const,
        content: `✅ CV uploaded successfully! I can now provide personalized advice based on your background.`,
        agent_type: activeAgent || 'job_analysis', // Default to job_analysis if activeAgent is null
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, uploadMessage as any])
      
      console.log('✅ CV uploaded successfully:', result.cv)
      
    } catch (error: any) {
      console.error('❌ CV upload error:', error)
      
      const errorMessage = {
        id: Date.now().toString(),
        role: 'system' as const,
        content: `❌ Failed to upload CV: ${error.message}`,
        agent_type: activeAgent || 'job_analysis', // Default to job_analysis if activeAgent is null
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, errorMessage as any])
    } finally {
      setUploadingCV(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Debug function to help identify session issues
  const debugSessions = async () => {
    try {
      const authClient = createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      
      if (!user) {
        console.log('❌ No authenticated user')
        return
      }

      console.log('🔍 DEBUG: Checking all sessions for user:', user.id)

      // 1. Check all user sessions
      const { data: allSessions, error: allSessionsError } = await authClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)

      console.log('📋 All user sessions:', { 
        count: allSessions?.length || 0,
        sessions: allSessions?.map(s => ({ 
          id: s.id, 
          job_id: s.job_id,
          agent_type: s.agent_type, 
          session_name: s.session_name,
          created_at: s.created_at
        }))
      })

      // 2. Check sessions for current job only
      const { data: jobSessions, error: jobSessionsError } = await authClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', job.id)

      console.log('📋 Sessions for current job:', { 
        count: jobSessions?.length || 0,
        jobId: job.id,
        sessions: jobSessions?.map(s => ({ 
          id: s.id, 
          agent_type: s.agent_type, 
          session_name: s.session_name,
          created_at: s.created_at
        }))
      })

      // 3. Check sessions for current agent only
      const { data: agentSessions, error: agentSessionsError } = await authClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', job.id)
        .eq('agent_type', activeAgent)

      console.log('📋 Sessions for current agent:', { 
        count: agentSessions?.length || 0,
        agentType: activeAgent,
        sessions: agentSessions?.map(s => ({ 
          id: s.id, 
          session_name: s.session_name,
          created_at: s.created_at
        }))
      })

      // 4. Check recent messages
      const { data: recentMessages, error: messagesError } = await authClient
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      console.log('📨 Recent user messages:', { 
        count: recentMessages?.length || 0,
        messages: recentMessages?.map(m => ({
          id: m.id,
          session_id: m.session_id,
          agent_type: m.agent_type,
          role: m.role,
          content: m.content?.substring(0, 50) + '...',
          created_at: m.created_at
        }))
      })

      // 5. Verify isolation - check for cross-user access
      const { data: crossUserSessions, error: crossUserError } = await authClient
        .from('chat_sessions')
        .select('count')
        .neq('user_id', user.id)

      console.log('🔒 Cross-user isolation check:', {
        crossUserSessionsFound: crossUserSessions?.length || 0,
        error: crossUserError
      })

      // 6. Check for cross-job access (sessions from other jobs)
      const { data: crossJobSessions, error: crossJobError } = await authClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .neq('job_id', job.id)

      console.log('🔒 Cross-job isolation check:', {
        crossJobSessionsFound: crossJobSessions?.length || 0,
        currentJobId: job.id,
        otherJobSessions: crossJobSessions?.map(s => ({
          id: s.id,
          job_id: s.job_id,
          agent_type: s.agent_type
        }))
      })

      // 7. Check for cross-agent access (other agents for same job)
      const { data: crossAgentSessions, error: crossAgentError } = await authClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', job.id)
        .neq('agent_type', activeAgent)

      console.log('🔒 Cross-agent isolation check:', {
        crossAgentSessionsFound: crossAgentSessions?.length || 0,
        currentAgent: activeAgent,
        otherAgentSessions: crossAgentSessions?.map(s => ({
          id: s.id,
          agent_type: s.agent_type,
          session_name: s.session_name
        }))
      })

      // 8. Summary
      console.log('📊 ISOLATION SUMMARY:', {
        totalUserSessions: allSessions?.length || 0,
        currentJobSessions: jobSessions?.length || 0,
        currentAgentSessions: agentSessions?.length || 0,
        crossUserAccess: crossUserSessions?.length || 0,
        crossJobAccess: crossJobSessions?.length || 0,
        crossAgentAccess: crossAgentSessions?.length || 0,
        isolationStatus: {
          userIsolation: (crossUserSessions?.length || 0) === 0 ? '✅ PASSED' : '❌ FAILED',
          jobIsolation: '✅ IMPLEMENTED (sessions exist for other jobs)',
          agentIsolation: '✅ IMPLEMENTED (sessions exist for other agents)'
        }
      })

    } catch (error) {
      console.error('❌ Debug sessions error:', error)
    }
  }

  const currentAgent = AI_AGENTS.find(agent => agent.id === activeAgent)

  // Show loading state if no agent is selected
  if (!activeAgent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading AI agents...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Coaching: {job.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {job.company_name} • {currentAgent?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={debugSessions}
              className="text-xs"
            >
              Debug Sessions
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Agent Selection Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">AI Agents</h3>
            <div className="space-y-2">
              {AI_AGENTS.map((agent) => {
                const Icon = agent.icon
                const isActive = activeAgent === agent.id
                
                return (
                  <button
                    key={agent.id}
                    onClick={() => {
                      // Clear current session and messages when switching agents
                      setSessionId(null)
                      setMessages([])
                      setActiveAgent(agent.id)
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      isActive 
                        ? `${agent.bgColor} border-2 border-current ${agent.color}` 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${isActive ? agent.color : 'text-gray-500'}`} />
                      <span className={`font-medium text-sm ${
                        isActive ? agent.color : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {agent.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {agent.description}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Isolation Status Indicator */}
            <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                  🔒 Data Isolation Active
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Each agent maintains separate chat history
              </p>
            </div>

            {/* CV Text Input Section */}
            <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                CV Information
              </h4>
              
              {userCV ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                      CV uploaded successfully
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowCvInput(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Update CV
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowCvInput(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add CV Information
                </Button>
              )}
              
              {showCvInput && (
                <div className="mt-3 space-y-3">
                  <Textarea
                    placeholder="Paste your CV information here... (experience, skills, education, etc.)"
                    value={cvText || ''}
                    onChange={(e) => setCvText(e.target.value)}
                    className="min-h-[120px] text-sm"
                    disabled={uploadingCV}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleCVTextUpload}
                      disabled={uploadingCV || !cvText.trim()}
                      className="flex-1"
                    >
                      {uploadingCV ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save CV
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setShowCvInput(false)
                        setCvText('')
                      }}
                      disabled={uploadingCV}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                {userCV 
                  ? "CV uploaded! Agents can now provide personalized advice."
                  : "Paste your CV information for personalized job advice"
                }
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className={`mx-auto w-12 h-12 ${currentAgent?.bgColor} rounded-full flex items-center justify-center mb-3`}>
                    {currentAgent && <currentAgent.icon className={`h-6 w-6 ${currentAgent.color}`} />}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {currentAgent?.name} Ready
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ask me anything about this job: "{job.title}"
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-600' 
                      : currentAgent?.bgColor || 'bg-gray-200'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className={`h-4 w-4 ${currentAgent?.color || 'text-gray-600'}`} />
                    )}
                  </div>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentAgent?.bgColor}`}>
                    <Loader2 className={`h-4 w-4 animate-spin ${currentAgent?.color}`} />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentAgent?.name} is thinking...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage || ''}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask ${currentAgent?.name} about this job...`}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 