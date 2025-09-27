import React from 'react';

const MarkdownRenderer = ({ content }) => {
  // 简单的markdown解析函数
  const parseMarkdown = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLanguage = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 代码块处理
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // 结束代码块
          elements.push({
            type: 'codeblock',
            content: codeBlockContent.join('\n'),
            language: codeBlockLanguage,
            key: `code-${i}`
          });
          codeBlockContent = [];
          codeBlockLanguage = '';
          inCodeBlock = false;
        } else {
          // 开始代码块
          if (currentParagraph.length > 0) {
            elements.push({
              type: 'paragraph',
              content: currentParagraph.join('\n'),
              key: `p-${i}`
            });
            currentParagraph = [];
          }
          codeBlockLanguage = line.substring(3).trim();
          inCodeBlock = true;
        }
        continue;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }
      
      // 标题处理
      if (line.startsWith('#')) {
        if (currentParagraph.length > 0) {
          elements.push({
            type: 'paragraph',
            content: currentParagraph.join('\n'),
            key: `p-${i}`
          });
          currentParagraph = [];
        }
        
        const level = line.match(/^#+/)[0].length;
        const text = line.substring(level).trim();
        elements.push({
          type: 'heading',
          level: level,
          content: text,
          key: `h-${i}`
        });
        continue;
      }
      
      // 列表处理
      if (line.match(/^[\s]*[-*+]\s/)) {
        if (currentParagraph.length > 0) {
          elements.push({
            type: 'paragraph',
            content: currentParagraph.join('\n'),
            key: `p-${i}`
          });
          currentParagraph = [];
        }
        
        const text = line.replace(/^[\s]*[-*+]\s/, '');
        elements.push({
          type: 'listitem',
          content: text,
          key: `li-${i}`
        });
        continue;
      }
      
      // 数字列表处理
      if (line.match(/^[\s]*\d+\.\s/)) {
        if (currentParagraph.length > 0) {
          elements.push({
            type: 'paragraph',
            content: currentParagraph.join('\n'),
            key: `p-${i}`
          });
          currentParagraph = [];
        }
        
        const text = line.replace(/^[\s]*\d+\.\s/, '');
        elements.push({
          type: 'orderedlistitem',
          content: text,
          key: `oli-${i}`
        });
        continue;
      }
      
      // 空行处理
      if (line.trim() === '') {
        if (currentParagraph.length > 0) {
          elements.push({
            type: 'paragraph',
            content: currentParagraph.join('\n'),
            key: `p-${i}`
          });
          currentParagraph = [];
        }
        continue;
      }
      
      // 普通文本
      currentParagraph.push(line);
    }
    
    // 处理剩余的段落
    if (currentParagraph.length > 0) {
      elements.push({
        type: 'paragraph',
        content: currentParagraph.join('\n'),
        key: `p-final`
      });
    }
    
    // 处理未关闭的代码块
    if (inCodeBlock && codeBlockContent.length > 0) {
      elements.push({
        type: 'codeblock',
        content: codeBlockContent.join('\n'),
        language: codeBlockLanguage,
        key: `code-final`
      });
    }
    
    return elements;
  };
  
  // 处理内联样式
  const processInlineStyles = (text) => {
    if (!text) return text;
    
    // 处理粗体 **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体 *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理内联代码 `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 处理链接 [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return text;
  };
  
  const elements = parseMarkdown(content);
  
  return (
    <div className="markdown-content">
      {elements.map((element) => {
        switch (element.type) {
          case 'heading':
            const HeadingTag = `h${Math.min(element.level, 6)}`;
            return React.createElement(HeadingTag, {
              key: element.key,
              className: `markdown-heading markdown-h${element.level}`,
              dangerouslySetInnerHTML: { __html: processInlineStyles(element.content) }
            });
            
          case 'paragraph':
            return (
              <p 
                key={element.key} 
                className="markdown-paragraph"
                dangerouslySetInnerHTML={{ __html: processInlineStyles(element.content) }}
              />
            );
            
          case 'codeblock':
            return (
              <pre key={element.key} className="markdown-codeblock">
                <code className={element.language ? `language-${element.language}` : ''}>
                  {element.content}
                </code>
              </pre>
            );
            
          case 'listitem':
            return (
              <ul key={element.key} className="markdown-list">
                <li 
                  className="markdown-listitem"
                  dangerouslySetInnerHTML={{ __html: processInlineStyles(element.content) }}
                />
              </ul>
            );
            
          case 'orderedlistitem':
            return (
              <ol key={element.key} className="markdown-ordered-list">
                <li 
                  className="markdown-listitem"
                  dangerouslySetInnerHTML={{ __html: processInlineStyles(element.content) }}
                />
              </ol>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;