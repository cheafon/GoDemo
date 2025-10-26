from google.adk.agents import SequentialAgent
from google.adk.agents.llm_agent import Agent
from .myprompts import gen_prompts, reflect_prompts, cur_prompts
from .mymcps import semantic_mcp, file_mcp, write_book

gen_agent = Agent(name="gen", description=gen_prompts,model='gemini-2.5-flash',tools=[semantic_mcp])

reflect_agent = Agent(name="reflect", description=reflect_prompts,model='gemini-2.5-flash')

cur_agent = Agent(name="cur", description=cur_prompts,model='gemini-2.5-flash',tools=[write_book])

root_agent = SequentialAgent(
    name='root_agent',
    sub_agents=[gen_agent,reflect_agent,cur_agent],
    description='A helpful assistant for user questions.',
)
