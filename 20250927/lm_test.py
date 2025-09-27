import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from llama_index.core import Settings
from llama_index.core.agent import FunctionAgent, AgentStream, ToolCall, AgentOutput, AgentInput, ToolCallResult
from llama_index.llms.deepseek import DeepSeek

from llama_index.tools.mcp import (
    get_tools_from_mcp_url,
    aget_tools_from_mcp_url, BasicMCPClient, McpToolSpec,
)
import asyncio
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
load_dotenv(".secret")
Settings.llm =DeepSeek(model="deepseek-chat", api_key=os.getenv("DEEPSEEK_API_KEY"))

# 全局状态 + 锁
class AppState:
    semantic_tools = None
    _init_lock = asyncio.Lock()  # 用于防止并发重复初始化

# 初始化 MCP 工具的函数（可复用）
async def initialize_semantic_tools():
    print("Attempting to initialize MCP client and tools...")
    local_client = BasicMCPClient(
        "npx",
        args=[
            "-y",
            "@smithery/cli@latest",
            "run",
            "@hamid-vakilzadeh/mcpsemanticscholar",
            "--key",
            os.getenv("SMITHERY_KEY"),
            "--profile",
            "intellectual-toucan-DB0osA"
        ],
        # env={
        #     "PATH": "/home/ss/.nvm/versions/node/v22.18.0/bin:" + os.environ.get("PATH", ""),
        #     "NODE_PATH": "/home/ss/.nvm/versions/node/v22.18.0"
        # },
        timeout=120
    )
    try:
        tools = await McpToolSpec(client=local_client).to_tool_list_async()
        print("MCP tools loaded successfully.")
        return tools
    except Exception as e:
        print(f"Failed to initialize MCP tools: {e}")
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: 尝试初始化一次（可选，也可完全懒加载）
    AppState.semantic_tools = await initialize_semantic_tools()
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 允许的前端地址
    # 或者开发阶段临时用：allow_origins=["*"]（不推荐生产环境）
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法（GET, POST 等）
    allow_headers=["*"],  # 允许所有头
)
@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_input = data["query"]


    # 检查是否已初始化，若未初始化则尝试懒加载
    if AppState.semantic_tools is None:
        async with AppState._init_lock:
            # 双重检查（Double-checked locking）
            if AppState.semantic_tools is None:
                tools = await initialize_semantic_tools()
                if tools is None:
                    return StreamingResponse(
                        iter(["Error: Failed to initialize MCP tools on demand."]),
                        media_type="text/plain"
                    )
                AppState.semantic_tools = tools


    #=============================================KEY======================================
    workflow = FunctionAgent(
        llm=Settings.llm,
        tools=AppState.semantic_tools,
        system_prompt="对用户的学术调研问题，使用对应工具进行查询，并返回结果。",
    )

    handler = workflow.run(user_msg=user_input)
    async def event_generator():
        async for event in handler.stream_events():
            if isinstance(event, AgentStream):
                yield event.delta
                print(event.delta, end="", flush=True)
            elif isinstance(event, ToolCall):
                # yield "\n=============================\n"
                # yield str(type(event))+":"+  event.tool_name+'\n'+str(event.tool_kwargs)
                yield event.tool_name
            # elif isinstance(event, AgentOutput):
            #     yield "\n=============================\n"
            #     yield str(type(event))+":"+  event.response.content
            # elif isinstance(event, AgentInput):
            #     for msg in event.input:
            #          yield "\n=============================\n"
            #          yield str(type(event))+":"+ msg.content
            elif isinstance(event, ToolCallResult):
                print(event.tool_output)
                # yield event.tool_output.content
            # else:
            #     yield str(type(event))+":"+  "Stop!!!!!!!!!!!!!"

    return StreamingResponse(event_generator(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("lm_test:app", host="127.0.0.1", port=8000,reload=True)
    # asyncio.run(main())
