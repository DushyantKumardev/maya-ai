# 🧠 Prompt Engineering Layer

Maya's "Brain" is driven by a sophisticated multi-stage prompt engineering system. This document explains how prompts are constructed, specialized, and delivered to the AI models using the **Modular Assembler Pipeline**.

---

## 🏗️ Architecture Overview

The prompt layer is located in `src/server/agent/prompt/` and follows a modular assembler pattern that combines specialized modules into a final system prompt:

- **`constants.ts`**: Static instruction templates for specific tasks (Title Generation, Summarization, Image Refinement, Vision Analysis).
- **`modules.ts`**: Functional builders for dynamic prompt sections (Base Persona, Memory Retrieval, Tool Usage, Interaction Style, Rules).
- **`index.ts`**: The main **Assembler** that orchestrates the construction of the system prompt for chat turns and background jobs.

---

## 🛠️ The System Prompt Assembler

The `assembleSystemPrompt` function in `index.ts` is the heart of the engine. It dynamically assembles the prompt using a layer-based approach.

### Layer-Based Assembly
The assembler accepts a `config` object containing structured flags for each layer. Each flag has a `status` field:
- **`on`**: Always include the layer.
- **`off`**: Never include the layer.
- **`auto`**: Only include the layer if its corresponding data is **non-empty**.

1. **Base Layer (Identity)**: 
   Always included. Sets the name, persona, current time, and user location context, localized via the user's `locale` setting.
   
2. **Memory Layer**:
   Controlled by `memory` flag. Injects persistent facts about the user (e.g., "User is a React developer").

3. **Summary Layer**:
   Controlled by `summary` flag. Injects a condensed version of earlier turns in the *active* conversation.

4. **Output Format Layer**:
   Controlled by `outputFormat` flag. Injects specific formatting constraints (Interaction Style).

5. **Tools Layer**:
   Controlled by `tools` flag. Provides available tools and strict usage guidelines.

6. **Rules Layer**:
   Controlled by `rules` flag. Enforces directness, opinionated responses, and human tone.

---

## 🏷️ Special Tags & Protocols

Maya uses specific XML-like tags to manage complex interactions:

### `<think>`
Wraps the AI's internal reasoning process. This is automatically managed by the assembler when a reasoning level (Low/Medium/High) is active.

### `<ask_user>`
Used when the AI needs more information before it can proceed.
- **Protocol**: The tag must contain a raw JSON object defining the questions.
- **Structure**: Includes `title` and an array of `questions`.
- **Example**: `<ask_user>{"title": "Search Scope", "questions": [...]}</ask_user>`

---

## 📂 File Structure Reference

| File | Responsibility |
| :--- | :--- |
| `modules.ts` | Functional builders for all dynamic prompt sections (Base, Memory, Summary, Interaction Style, Rules, Tools). |
| `constants.ts` | Static instruction templates for specific autonomous tasks (Web Search refinement, Summarization logic, Title Generation, Vision prompts). |
| `index.ts` | The Assembler pipeline (`buildSystemPrompt`) and background task message helpers (`buildTitleMessages`, `buildSummaryMessages`). |
