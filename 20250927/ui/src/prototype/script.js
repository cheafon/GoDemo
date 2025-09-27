// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化聊天功能
    initChat();
    
    // 初始化模态框
    initModal();
    
    // 添加窗口大小调整事件处理程序
    let resizeTimeout;
    window.addEventListener('resize', function() {
        // 使用防抖动技术，避免频繁重新渲染
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // 只有在可视化区域可见时才重新初始化图表和知识图谱
            const visualizationSection = document.getElementById('visualizationSection');
            if (visualizationSection.classList.contains('visible')) {
                initCharts();
                initKnowledgeGraph();
            }
        }, 300);
    });
});

// 显示可视化区域
function showVisualization() {
    const visualizationSection = document.getElementById('visualizationSection');
    
    // 如果已经可见，不需要再次初始化
    if (visualizationSection.classList.contains('visible')) {
        return;
    }
    
    // 添加可见类，触发动画
    visualizationSection.classList.add('visible');
    
    // 初始化图表和知识图谱
    setTimeout(() => {
        initCharts();
        initKnowledgeGraph();
        
        // 滚动到可视化区域
        visualizationSection.scrollIntoView({ behavior: 'smooth' });
    }, 300); // 等待过渡动画开始后再初始化
}

// 初始化所有图表的函数
function initCharts() {
    initDomainChart();
    initAuthorChart();
    initCitationChart();
    initYearlyTrendChart();
}

// 初始化知识图谱
function initKnowledgeGraph() {
    // 清空现有图谱
    const container = document.getElementById('knowledgeGraph');
    container.innerHTML = '';
    
    // 设置图谱尺寸
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 创建SVG元素
    const svg = d3.select('#knowledgeGraph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // 创建模拟数据
    const graphData = createGraphData();
    
    // 创建力导向图
    const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));
    
    // 创建连线
    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graphData.links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', d => Math.sqrt(d.value));
    
    // 创建节点组
    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // 添加节点圆圈
    node.append('circle')
        .attr('r', d => d.type === 'paper' ? 8 : (d.type === 'author' ? 10 : (d.type === 'topic' ? 12 : 9)))
        .attr('fill', d => {
            switch(d.type) {
                case 'paper': return '#4285F4';
                case 'author': return '#EA4335';
                case 'topic': return '#FBBC05';
                case 'institution': return '#34A853';
                default: return '#999';
            }
        });
    
    // 添加节点文本
    node.append('text')
        .attr('dx', 12)
        .attr('dy', '.35em')
        .text(d => d.name)
        .attr('font-size', '10px');
    
    // 添加节点标题（悬停提示）
    node.append('title')
        .text(d => d.name);
    
    // 更新力导向图
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('transform', d => {
                // 限制节点在视图范围内
                d.x = Math.max(20, Math.min(width - 20, d.x));
                d.y = Math.max(20, Math.min(height - 20, d.y));
                return `translate(${d.x}, ${d.y})`;
            });
    });
    
    // 拖拽开始
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    // 拖拽中
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    // 拖拽结束
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// 创建知识图谱模拟数据
function createGraphData() {
    // 创建节点
    const nodes = [
        // 论文节点
        { id: 'paper1', name: 'Attention Is All You Need', type: 'paper' },
        { id: 'paper2', name: 'BERT: Pre-training of Deep Bidirectional Transformers', type: 'paper' },
        { id: 'paper3', name: 'GPT-3: Language Models are Few-Shot Learners', type: 'paper' },
        { id: 'paper4', name: 'Deep Residual Learning for Image Recognition', type: 'paper' },
        { id: 'paper5', name: 'Generative Adversarial Networks', type: 'paper' },
        { id: 'paper6', name: 'CLIP: Learning Transferable Visual Models', type: 'paper' },
        { id: 'paper7', name: 'Transformer-XL: Attentive Language Models', type: 'paper' },
        { id: 'paper8', name: 'DALL·E: Creating Images from Text', type: 'paper' },
        
        // 作者节点
        { id: 'author1', name: 'Ashish Vaswani', type: 'author' },
        { id: 'author2', name: 'Jacob Devlin', type: 'author' },
        { id: 'author3', name: 'Tom B. Brown', type: 'author' },
        { id: 'author4', name: 'Kaiming He', type: 'author' },
        { id: 'author5', name: 'Ian Goodfellow', type: 'author' },
        { id: 'author6', name: 'Alec Radford', type: 'author' },
        
        // 主题节点
        { id: 'topic1', name: '自然语言处理', type: 'topic' },
        { id: 'topic2', name: '计算机视觉', type: 'topic' },
        { id: 'topic3', name: '生成模型', type: 'topic' },
        { id: 'topic4', name: '多模态学习', type: 'topic' },
        
        // 机构节点
        { id: 'inst1', name: 'Google', type: 'institution' },
        { id: 'inst2', name: 'OpenAI', type: 'institution' },
        { id: 'inst3', name: 'Microsoft', type: 'institution' },
        { id: 'inst4', name: 'Facebook', type: 'institution' }
    ];
    
    // 创建连接
    const links = [
        // 论文与作者的连接
        { source: 'paper1', target: 'author1', value: 3 },
        { source: 'paper2', target: 'author2', value: 3 },
        { source: 'paper3', target: 'author3', value: 3 },
        { source: 'paper4', target: 'author4', value: 3 },
        { source: 'paper5', target: 'author5', value: 3 },
        { source: 'paper6', target: 'author6', value: 3 },
        { source: 'paper7', target: 'author1', value: 2 },
        { source: 'paper8', target: 'author6', value: 3 },
        
        // 论文与主题的连接
        { source: 'paper1', target: 'topic1', value: 2 },
        { source: 'paper2', target: 'topic1', value: 2 },
        { source: 'paper3', target: 'topic1', value: 2 },
        { source: 'paper4', target: 'topic2', value: 2 },
        { source: 'paper5', target: 'topic3', value: 2 },
        { source: 'paper6', target: 'topic4', value: 2 },
        { source: 'paper7', target: 'topic1', value: 2 },
        { source: 'paper8', target: 'topic4', value: 2 },
        { source: 'paper8', target: 'topic3', value: 2 },
        
        // 论文之间的引用关系
        { source: 'paper2', target: 'paper1', value: 1 },
        { source: 'paper3', target: 'paper1', value: 1 },
        { source: 'paper3', target: 'paper2', value: 1 },
        { source: 'paper6', target: 'paper5', value: 1 },
        { source: 'paper7', target: 'paper1', value: 1 },
        { source: 'paper8', target: 'paper6', value: 1 },
        
        // 作者与机构的连接
        { source: 'author1', target: 'inst1', value: 2 },
        { source: 'author2', target: 'inst1', value: 2 },
        { source: 'author3', target: 'inst2', value: 2 },
        { source: 'author4', target: 'inst4', value: 2 },
        { source: 'author5', target: 'inst2', value: 2 },
        { source: 'author6', target: 'inst2', value: 2 }
    ];
    
    return { nodes, links };
}

// 初始化模态框
function initModal() {
    const modal = document.getElementById('paperModal');
    const closeButton = document.getElementById('closeModal');
    
    // 关闭模态框
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 聊天功能初始化
function initChat() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    
    // 发送按钮点击事件
    sendButton.addEventListener('click', function() {
        sendMessage();
    });
    
    // 按下Enter键发送消息
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 发送消息函数
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // 添加用户消息到聊天区域
        addMessage(message, 'user');
        
        // 清空输入框
        userInput.value = '';
        
        // 显示可视化区域（在第一次发送消息时）
        showVisualization();
        
        // 模拟AI响应
        simulateResponse(message);
    }
    
    // 添加消息到聊天区域
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        
        // 滚动到最新消息
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 模拟AI流式响应
    function simulateResponse(userMessage) {
        // 获取响应类型和内容
        const responseData = getResponseForQuery(userMessage);
        
        // 检查是否需要显示调研过程
        if (responseData.showResearchProcess) {
            // 显示搜索过程
            setTimeout(() => {
                addProcessMessage('searching', '正在搜索相关论文和本地资料库...');
            }, 500);
            
            // 显示分析过程
            setTimeout(() => {
                addProcessMessage('analyzing', '分析检索到的论文内容和相关数据...');
            }, 2000);
            
            // 显示思考过程
            setTimeout(() => {
                addProcessMessage('thinking', '思考问题的多个维度和可能的解释...');
            }, 3500);
            
            // 显示总结过程
            setTimeout(() => {
                addProcessMessage('summarizing', '整合信息并生成综合回答...');
            }, 5000);
            
            // 最后显示最终回答
            setTimeout(() => {
                // 创建助手最终回答消息元素
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', 'assistant');
                chatMessages.appendChild(messageDiv);
                
                // 模拟流式输出最终回答
                let i = 0;
                const interval = setInterval(() => {
                    if (i < responseData.content.length) {
                        messageDiv.textContent += responseData.content.charAt(i);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        i++;
                    } else {
                        clearInterval(interval);
                    }
                }, 20); // 每20毫秒添加一个字符
            }, 6500);
        } else {
            // 不需要显示调研过程，直接显示回答
            // 创建助手消息元素
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'assistant');
            chatMessages.appendChild(messageDiv);
            
            // 模拟流式输出
            let i = 0;
            const interval = setInterval(() => {
                if (i < responseData.content.length) {
                    messageDiv.textContent += responseData.content.charAt(i);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 20); // 每20毫秒添加一个字符
        }
    }
    
    // 添加调研过程消息
    function addProcessMessage(type, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        
        // 添加过程标签
        const labelSpan = document.createElement('span');
        labelSpan.classList.add('process-label');
        
        // 设置不同过程的标签文本
        switch(type) {
            case 'searching':
                labelSpan.textContent = '🔍 搜索:';
                break;
            case 'analyzing':
                labelSpan.textContent = '📊 分析:';
                break;
            case 'thinking':
                labelSpan.textContent = '🧠 思考:';
                break;
            case 'summarizing':
                labelSpan.textContent = '📝 总结:';
                break;
            default:
                labelSpan.textContent = '处理中:';
        }
        
        messageDiv.appendChild(labelSpan);
        messageDiv.appendChild(document.createTextNode(' ' + text));
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 根据用户问题生成回答
    function getResponseForQuery(query) {
        query = query.toLowerCase();
        
        // 检查是否是论文生成请求
        if (query.includes("请帮我生成一篇关于") && query.includes("的论文")) {
            // 提取论文主题
            let topic = query.split("请帮我生成一篇关于")[1].split("的论文")[0];
            
            // 显示生成成功的模态框
            setTimeout(function() {
                showPaperGeneratedModal(topic);
            }, 2000);
            
            return {
                content: "正在生成关于" + topic + "的论文，请稍候...",
                showResearchProcess: false
            };
        }
        
        // 需要显示调研过程的问题类型
        const researchQueries = [
            "最近的研究趋势", "研究进展", "最新进展", "前沿研究", "调研", 
            "综述", "比较", "分析", "评估", "对比", "优缺点", "如何选择",
            "哪个更好", "有什么区别", "发展历程", "未来方向"
        ];
        
        // 检查是否需要显示调研过程
        let needsResearch = researchQueries.some(term => query.includes(term));
        
        // 预设的问答对
        const responses = {
            "什么是rag": {
                content: "RAG (Retrieval-Augmented Generation) 是一种结合了检索系统和生成式AI的技术。它通过从大型文档库中检索相关信息，然后将这些信息提供给大型语言模型，使模型能够生成基于事实和最新信息的回答。在论文辅助阅读系统中，RAG可以帮助用户快速找到相关论文内容并提供准确的解释和总结。",
                showResearchProcess: false
            },
            
            "最近的ai研究趋势": {
                content: "最近的AI研究趋势主要集中在以下几个方向：\n\n1. 多模态大型语言模型 (MLLMs)：结合文本、图像、音频等多种模态的模型，如GPT-4V、Claude 3、Gemini等\n\n2. 小型高效模型：通过知识蒸馏、量化等技术降低模型大小和计算需求\n\n3. 代理系统 (Agent)：能够自主规划和执行任务的AI系统\n\n4. 对齐与安全：提高模型与人类价值观的一致性，减少有害输出\n\n5. 领域特定应用：针对医疗、法律、科研等特定领域优化的AI系统",
                showResearchProcess: true
            },
            
            "谁是深度学习领域最有影响力的研究者": {
                content: "深度学习领域最有影响力的研究者包括：\n\n1. Yoshua Bengio - 蒙特利尔大学教授，因神经网络研究获得2018年图灵奖\n\n2. Geoffrey Hinton - 被称为深度学习之父，多伦多大学教授，Google研究员\n\n3. Yann LeCun - Facebook AI研究院主任，纽约大学教授，卷积神经网络先驱\n\n4. Andrew Ng - 斯坦福大学教授，Coursera联合创始人，深度教育的推广者\n\n5. Fei-Fei Li - 斯坦福大学教授，计算机视觉和ImageNet数据集的先驱\n\n6. Demis Hassabis - DeepMind创始人，强化学习和AI游戏领域的领导者",
                showResearchProcess: true
            },
            
            "transformer模型是什么": {
                content: "Transformer模型是一种基于自注意力机制的神经网络架构，由Google在2017年的论文《Attention Is All You Need》中提出。它彻底改变了自然语言处理领域，是现代大型语言模型的基础。\n\n主要特点：\n1. 自注意力机制：允许模型关注输入序列中的不同部分\n2. 并行处理：不像RNN需要顺序处理，可以并行计算\n3. 多头注意力：从多个角度学习表示\n4. 编码器-解码器结构：适用于各种序列到序列任务\n\nTransformer架构是GPT、BERT、T5等现代NLP模型的基础，已扩展到计算机视觉等其他领域。",
                showResearchProcess: false
            },
            
            "如何评估论文质量": {
                content: "评估学术论文质量可以从以下几个方面考虑：\n\n1. 发表期刊/会议的影响力：顶级期刊和会议通常有严格的同行评审\n\n2. 引用次数：高引用通常表明论文有重要影响力\n\n3. 研究方法的严谨性：实验设计、数据收集和分析方法是否科学合理\n\n4. 创新性：提出的方法或理论是否有新颖之处\n\n5. 实验结果：结果是否显著，与现有方法相比是否有明显改进\n\n6. 论文结构与清晰度：论文是否组织良好，表达清晰\n\n7. 作者背景：作者及其所在机构的学术声誉\n\n8. 伦理考量：研究是否遵循伦理准则，特别是涉及人类或动物实验时",
                showResearchProcess: true
            }
        };
        
        // 默认回答
        let defaultResponse = {
            content: "非常抱歉，我目前没有关于这个问题的具体信息。您可以尝试询问有关论文领域、研究趋势、评估方法或特定AI技术的问题。您也可以输入'请帮我生成一篇关于[主题]的论文'来生成一篇学术论文。",
            showResearchProcess: false
        };
        
        // 检查是否有匹配的预设回答
        for (const key in responses) {
            if (query.includes(key)) {
                return responses[key];
            }
        }
        
        // 如果包含特定关键词，给出相应回答
        if (query.includes("论文") && query.includes("写作")) {
            return {
                content: "学术论文写作建议：\n\n1. 明确研究问题：确保研究问题具体、明确且有价值\n\n2. 文献综述：全面了解领域现状，找出研究空白\n\n3. 方法学严谨：实验设计合理，数据收集方法科学\n\n4. 结果呈现：使用适当的图表和表格清晰展示结果\n\n5. 讨论深入：解释结果意义，承认局限性，提出未来方向\n\n6. 结构清晰：遵循IMRAD结构（引言、方法、结果、讨论）\n\n7. 语言精炼：使用准确、简洁的学术语言\n\n8. 引用规范：正确引用他人工作，避免抄袭",
                showResearchProcess: needsResearch
            };
        } else if (query.includes("机器学习") || query.includes("深度学习")) {
            return {
                content: "机器学习和深度学习是当前AI研究的主要方向。近期趋势包括：\n\n1. 自监督学习：减少对标注数据的依赖\n\n2. 图神经网络：处理图结构数据\n\n3. 神经架构搜索：自动设计网络结构\n\n4. 联邦学习：保护隐私的分布式学习\n\n5. 可解释AI：理解模型决策过程\n\n6. 强化学习：通过与环境交互学习策略\n\n7. 多模态学习：整合文本、图像、音频等多种数据类型",
                showResearchProcess: needsResearch
            };
        } else if (query.includes("引用") || query.includes("参考文献")) {
            return {
                content: "学术论文中正确管理参考文献的建议：\n\n1. 使用文献管理软件：如Zotero、Mendeley或EndNote\n\n2. 遵循特定引用格式：根据目标期刊要求选择APA、MLA、Chicago等格式\n\n3. 引用多样化：包括经典文献和最新研究\n\n4. 避免过度引用：每个观点选择最相关的文献\n\n5. 直接引用与间接引用：明确区分直接引用和改写内容\n\n6. 检查准确性：确保引用信息完整、准确\n\n7. 避免二手引用：尽量阅读并引用原始文献",
                showResearchProcess: needsResearch
            };
        } else if (query.includes("生成论文") || query.includes("写论文")) {
            return {
                content: "您可以输入'请帮我生成一篇关于[您感兴趣的主题]的论文'，我将为您生成一篇符合学术格式的论文。",
                showResearchProcess: false
            };
        }
        
        // 对于其他问题，如果包含需要调研的关键词，显示调研过程
        if (needsResearch) {
            return {
                content: "根据我对相关论文和研究资料的分析，" + defaultResponse.content,
                showResearchProcess: true
            };
        }
        
        return defaultResponse;
    }
    
    // 显示论文生成成功的模态框
    function showPaperGeneratedModal(topic) {
        const modal = document.getElementById('paperModal');
        const paperLink = document.getElementById('paperLink');
        
        // 更新链接，添加主题参数
        paperLink.href = `paper-template.html?topic=${encodeURIComponent(topic)}`;
        
        // 显示模态框
        modal.style.display = 'flex';
    }
}

// 领域论文数图表
function initDomainChart() {
    const ctx = document.getElementById('domainChart').getContext('2d');
    
    // 销毁已存在的图表实例（如果有）
    if (window.domainChartInstance) {
        window.domainChartInstance.destroy();
    }
    
    // 创建新的图表实例并保存引用
    window.domainChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['机器学习', '自然语言处理', '计算机视觉', '强化学习', '图神经网络', '多模态学习'],
            datasets: [{
                data: [35, 25, 20, 10, 5, 5],
                backgroundColor: [
                    '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8F00FF', '#00FFFF'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 100,
            animation: {
                duration: 500
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

// 火热作者排名图表
function initAuthorChart() {
    const ctx = document.getElementById('authorChart').getContext('2d');
    
    // 销毁已存在的图表实例（如果有）
    if (window.authorChartInstance) {
        window.authorChartInstance.destroy();
    }
    
    // 创建新的图表实例并保存引用
    window.authorChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Yoshua Bengio', 'Geoffrey Hinton', 'Yann LeCun', 'Andrew Ng', 'Fei-Fei Li'],
            datasets: [{
                label: '引用次数 (千)',
                data: [120, 105, 95, 85, 75],
                backgroundColor: '#4285F4',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 100,
            animation: {
                duration: 500
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '引用次数 (千)',
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

// 引用量分布图表
function initCitationChart() {
    const ctx = document.getElementById('citationChart').getContext('2d');
    
    // 销毁已存在的图表实例（如果有）
    if (window.citationChartInstance) {
        window.citationChartInstance.destroy();
    }
    
    // 创建新的图表实例并保存引用
    window.citationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0-10', '11-50', '51-100', '101-500', '501-1000', '1000+'],
            datasets: [{
                label: '论文数量',
                data: [450, 320, 180, 120, 50, 20],
                backgroundColor: '#34A853',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 100,
            animation: {
                duration: 500
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '引用次数范围',
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '论文数量',
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

// 年度发表趋势图表
function initYearlyTrendChart() {
    const ctx = document.getElementById('yearlyTrendChart').getContext('2d');
    
    // 销毁已存在的图表实例（如果有）
    if (window.yearlyTrendChartInstance) {
        window.yearlyTrendChartInstance.destroy();
    }
    
    // 创建新的图表实例并保存引用
    window.yearlyTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2018', '2019', '2020', '2021', '2022', '2023'],
            datasets: [{
                label: '机器学习',
                data: [320, 350, 400, 450, 520, 580],
                borderColor: '#4285F4',
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
                tension: 0.3,
                fill: true
            }, {
                label: '自然语言处理',
                data: [250, 300, 380, 450, 500, 550],
                borderColor: '#EA4335',
                backgroundColor: 'rgba(234, 67, 53, 0.1)',
                tension: 0.3,
                fill: true
            }, {
                label: '计算机视觉',
                data: [280, 320, 360, 400, 450, 490],
                borderColor: '#FBBC05',
                backgroundColor: 'rgba(251, 188, 5, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 100,
            animation: {
                duration: 500
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '年份',
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '论文数量',
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}