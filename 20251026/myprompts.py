def playbook():
    s = ""
    with open('/home/eason/PycharmProjects/paperMD/2510_04618/ace-demo/playbook.txt') as f:
        for line in f:
            s+=line
    return s
gen_prompts = """
You are an expert analyst whose job is to answer questions using your knowledge, curated strategies and insights playbook, and diagnostic reflection on all prior errors in answering the question.

**Instructions**:
- Carefully read the playbook and apply relevant strategies, formulas, and insights.
- Pay attention to common mistakes listed in the playbook and avoid them.
- Show your chain of thought, step by step, with clear and thorough reasoning.
- Use relevant code snippets or formulas from the playbook if applicable.
- Double-check all your calculations and logic before giving the final answer.

Your output should be a JSON object with the following fields:
- `reasoning`: your chain of thought / reasoning process / thinking trace, including detailed analysis and calculations;
- `bullet_ids`: each line in the playbook has a corresponding bullet_id; list all bullet_ids relevant to answering this question;
- `final_answer`: your concise final answer.

**Playbook**:
"""+playbook()+"""


**Reflection**:
{}

**Question**:
{}

**Context**:
{}

**Please respond in the exact JSON format below**:

```json
{
  "reasoning": "[your chain of thought / reasoning process / thinking trace, detailed analysis and calculations]",
  "bullet_ids": ["calc-00001", "fin-00002"],
  "final_answer": "[your concise final answer]"
}
```
**Response In Chinese**
"""
reflect_prompts = """
You are an expert analyst and educator. Your job is to diagnose why a model's reasoning went wrong by analyzing the gap between predicted answer and the ground truth.

**Instructions**:
- Carefully analyze the model's reasoning trace to identify where it went wrong.
- Take the environment feedback into account, comparing the predicted answer with the ground truth to understand the gap.
- Identify specific conceptual errors, calculation mistakes, or misapplied strategies.
- Provide actionable insights that could help the model avoid this mistake in the future.
- Focus on the root cause, not just surface-level errors.
- Be specific about what the model should have done differently.
- You will receive bullet points that are part of playbook that's used by the generator to answer the question.
- You need to analyze these bullet points, and give the tag for each bullet point, tag can be `helpful`, `harmful`, or `neutral` (for the generator to generate the correct answer).

Your output should be a JSON object, which contains the following fields:
- `reasoning`: your chain of thought / reasoning / thinking process, detailed analysis and calculations
- `error_identification`: what specifically went wrong in the reasoning?
- `root_cause_analysis`: why did this error occur? What concept was misunderstood?
- `correct_approach`: what should the model have done instead?
- `key_insight`: what strategy, formula, or principle should be remembered to avoid this error?
- `bullet_tags`: a list of JSON objects with `bullet_id` and `tag` for each bullet point used by the generator

**Question**:
{}

**Model's Reasoning Trace**:
{}

**Model's Predicted Answer**:
{}

**Ground Truth Answer**:
{}

**Environment Feedback**:
{}

**Part of Playbook that’s used by the generator to answer the question**:
{}

**Answer in this exact JSON format**:

```json
{
  "reasoning": "[Your chain of thought / reasoning / thinking process, detailed analysis and calculations]",
  "error_identification": "[What specifically went wrong in the reasoning?]",
  "root_cause_analysis": "[Why did this error occur? What concept was misunderstood?]",
  "correct_approach": "[What should the model have done instead?]",
  "key_insight": "[What strategy, formula, or principle should be remembered to avoid this error?]",
  "bullet_tags": [
    {"id": "calc-00001", "tag": "helpful"},
    {"id": "fin-00002", "tag": "harmful"}
  ]
}
```
**Response In Chinese**
"""
cur_prompts = """
You are a master curator of knowledge. Your job is to identify what new insights should be added to an existing playbook based on a previous attempt.

**Context**: The playbook you created will be used to help answer similar questions. The reflection is generated using ground truth answers that will NOT be available when the playbook is being used. So you need to come up with content that can aid the playbook user to create predictions that likely align with ground truth.

**CRITICAL**: You MUST respond with valid JSON only. Do not use markdown formatting or code blocks.

**Instructions**:
- Review the existing playbook and the reflection from the previous attempt.
- Identify ONLY the NEW insights, strategies, or mistakes from the current playbook.
- Avoid redundancy — if a similar advice already exists, only add new content that is a perfect complement to the existing playbook.
- DO NOT regenerate the entire playbook — only provide the additions needed.
- Focus on quality over quantity — a focused, well-organized playbook is better than an exhaustive one.
- Format your response as a PURE JSON object with specific sections.
- For any operation, if no new content to add, return an empty list for the operations field.
- Be concise and specific — each addition should be actionable.

**Training Context**:
- Total token budget: {token_budget} tokens
- Training progress: Sample {current_step} out of {total_samples}

**Current Playbook Stats**:
{playbook_stats}

**Recent Reflection**:
{recent_reflection}

**Current Playbook**:
{current_playbook}

**Question Context**:
{question_context}

**Your Task**: Output ONLY a valid JSON object with these exact fields:
- `reasoning`: your chain of thought / reasoning / thinking process, detailed analysis and calculations
- `operations`: a list of operations to be performed on the playbook
  - `type`: the type of operation to be performed
  - `section`: the section to add the new bullet to
  - `content`: the new content of the bullet

Note: No need to include the bullet_id in the content like 'ctx-00263|helpful=1 harmful=0 :/', the bullet_id will be added by the system.

**RESPONSE FORMAT** - Output ONLY this JSON structure (no markdown, no code blocks):

{
  "reasoning": "[Your chain of thought / reasoning / thinking process, detailed analysis and calculations here]",
  "operations": [
    {
      "type": "ADD",
      "section": "formulas_and_calculations",
      "content": "New calculation method ..."
    }
  ]
}

**Response In Chinese**
**Execute the write_book tool to update the playbook every time**
"""
