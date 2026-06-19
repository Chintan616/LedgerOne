import api from './auth'

export const sendMessage = (message, conversationId) =>
  api.post('/chat', { message, conversationId })
