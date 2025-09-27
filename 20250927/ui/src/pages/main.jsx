import React, { useState, useEffect, useRef } from 'react';
import { Send, Square, Trash2 } from 'lucide-react';
import './main.css';
import MarkdownRenderer from '../components/MarkdownRenderer';

const Main = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [toolCalls, setToolCalls] = useState([]);
  const [isToolCallActive, setIsToolCallActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse, toolCalls, isToolCallActive]);

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // 重置状态
    setIsLoading(true);
    setCurrentResponse('');
    setToolCalls([]);
    setIsToolCallActive(false);
    setIsGenerating(true); // 开始生成时设置为true
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');
    setToolCalls([]);
    setIsToolCallActive(false); // 重置工具调用状态

    // 添加用户消息
    setMessages(prev => [...prev, { type: 'user', content: userMessage, timestamp: Date.now() }]);

    // 用于累积响应的变量
    let assistantResponse = '';
    let currentToolCalls = [];

    try {
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();

      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const result = processStreamLine(line);
            if (result) {
              if (result.type === 'text') {
                assistantResponse += result.content;
                setCurrentResponse(assistantResponse);
              } else if (result.type === 'tool_call') {
                // 设置工具调用活跃状态
                setIsToolCallActive(true);
                currentToolCalls.push(result);
                setToolCalls([...currentToolCalls]);
              } else if (result.type === 'tool_call_end') {
                // 工具调用结束
                setIsToolCallActive(false);
              }
            }
          }
        }
      }

      // 处理剩余的buffer
      if (buffer.trim()) {
        const result = processStreamLine(buffer);
        if (result) {
          if (result.type === 'text') {
            assistantResponse += result.content;
            setCurrentResponse(assistantResponse);
          } else if (result.type === 'tool_call') {
            setIsToolCallActive(true);
            currentToolCalls.push(result);
            setToolCalls([...currentToolCalls]);
          } else if (result.type === 'tool_call_end') {
            setIsToolCallActive(false);
          }
        }
      }

      // 完成响应，添加到消息列表
      if (assistantResponse || currentToolCalls.length > 0) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: assistantResponse,
          toolCalls: currentToolCalls,
          timestamp: Date.now()
        }]);
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Error:', error);
        setMessages(prev => [...prev, {
          type: 'error',
          content: `错误: ${error.message}`,
          timestamp: Date.now()
        }]);
      }
    } finally {
      setIsLoading(false);
      setCurrentResponse('');
      setToolCalls([]);
      setIsToolCallActive(false);
      setIsGenerating(false); // 结束生成时设置为false
    }
  };

  // 处理流式数据行
  const processStreamLine = (line) => {
    if (line.includes('=============================')) {
      return null; // 跳过分隔符
    }

    // 过滤掉 AgentInput 和 Stop 类型
    if (line.includes('AgentInput:') || line.includes('Stop')) {
      return null;
    }

    // 检查是否包含工具调用相关的内容
    if (line.includes('ToolCall:') || line.includes('tool_call') || line.includes('papers-search-basic')) {
      const toolInfo = line.replace(/.*ToolCall:/, '').trim() || line.trim();
      return {
        type: 'tool_call',
        content: toolInfo,
        timestamp: Date.now()
      };
    }
    
    // 检查工具调用结束标志
    if (line.includes('ToolCallResult:') || line.includes('tool_call_result')) {
      return {
        type: 'tool_call_end'
      };
    }
    
    if (line.includes('AgentStream:') || line.includes('AgentOutput:')) {
      // 解析不同类型的事件
      if (line.includes('AgentOutput:')) {
        const output = line.replace(/.*AgentOutput:/, '').trim();
        return {
          type: 'text',
          content: output
        };
      }
    } else {
      // 普通的流式文本（AgentStream的增量内容）
      // 但要排除包含工具调用信息的行
      if (!line.includes('llama_index.core.agent.workflow.workflow_events.ToolCall') && 
          !line.includes('papers-search-basic') &&
          !line.includes('ToolCallResult:')) {
        return {
          type: 'text',
          content: line
        };
      } else {
        // 这是工具调用信息，应该作为工具调用处理
        return {
          type: 'tool_call',
          content: line.trim(),
          timestamp: Date.now()
        };
      }
    }
    return null;
  };

  // 停止当前请求
  // 停止生成
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
  
  // 清空聊天
  const clearChat = () => {
    setMessages([]);
    setCurrentResponse('');
    setToolCalls([]);
    setIsToolCallActive(false);
    setIsGenerating(false);
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 渲染消息
  const renderMessage = (message) => {
    switch (message.type) {
      case 'user':
        return (
          <div key={message.timestamp} className="message user-message">
            <div className="message-content">
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        );

      case 'assistant':
        return (
          <div key={message.timestamp} className="assistant-response-container">
            {/* 工具调用容器 - 优先显示，每个工具调用独立显示 */}
            {message.toolCalls && message.toolCalls.map((toolCall, index) => (
              <div key={index} className="message tool-call-message">
                <div className="message-content">
                  <div className="tool-call-header">🔧 工具调用 #{index + 1}</div>
                  <div className="tool-call-content">
                    <pre>{toolCall.content}</pre>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 文本响应容器 - 在工具调用之后显示 */}
            {message.content && (
              <div className="message assistant-message">
                <div className="message-content">
                  <div className="message-text">
                    <MarkdownRenderer content={message.content} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div key={message.timestamp} className="message error-message">
            <div className="message-content">
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>AI学术助手</h1>
        <div className="header-actions">
          <button onClick={clearChat} className="clear-btn" disabled={isLoading}>
            清空对话
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(renderMessage)}
        
        {/* 当前正在生成的响应 */}
        {isLoading && (
          <div className="assistant-response-container generating">
            {/* 工具调用容器 - 优先显示 */}
            {toolCalls.map((toolCall, index) => (
              <div key={index} className="message tool-call-message">
                <div className="message-content">
                  <div className="tool-call-header">
                    🔧 工具调用 #{index + 1}
                    {isToolCallActive && <div className="loading-spinner"></div>}
                  </div>
                  <div className="tool-call-content">
                    <pre>{toolCall.content}</pre>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 工具调用等待指示器 - 当有工具调用活跃但还没有文本响应时显示 */}
            {isToolCallActive && !currentResponse && toolCalls.length === 0 && (
              <div className="message tool-call-message">
                <div className="message-content">
                  <div className="tool-call-header">
                    🔧 正在调用工具...
                    <div className="loading-spinner"></div>
                  </div>
                  <div className="tool-call-waiting">
                    <div className="loading-indicator">
                      <div className="loading-spinner large"></div>
                      <span>工具执行中，请稍候...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 文本响应容器 - 在工具调用之后显示 */}
            {currentResponse && (
              <div className="message assistant-message">
                <div className="message-content">
                  <div className="message-text">
                    {isGenerating ? (
                      <>{currentResponse}</>
                    ) : (
                      <MarkdownRenderer content={currentResponse} />
                    )}
                    <span className="cursor">|</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 初始加载指示器 - 只在没有任何内容时显示 */}
        {isLoading && !currentResponse && toolCalls.length === 0 && !isToolCallActive && (
          <div className="message assistant-message">
            <div className="message-content">
              <div className="loading-indicator">
                <div className="loading-spinner large"></div>
                <span>Waiting...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="输入您的问题..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={isLoading}
        />
        <div className="input-buttons">
          {isLoading ? (
            <button onClick={stopGeneration} className="stop-btn" title="停止生成">
              <Square size={20} />
            </button>
          ) : (
            <button onClick={sendMessage} className="send-btn" disabled={!input.trim()}>
              <Send size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Main;