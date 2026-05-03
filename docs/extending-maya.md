# 🧩 Extending Maya AI

Maya is designed to be extremely extensible. You can add new capabilities by creating **Tools** that the AI can use to interact with external services or perform specific tasks.

---

## 🛠️ Adding a New Tool

Follow these steps to add a new tool to Maya's arsenal:

### 1. Create the Tool Directory
Create a new folder in `src/server/agent/tools/definitions/` (e.g., `src/server/agent/tools/definitions/my-new-tool`).

### 2. Implement the Tool
Create an `index.ts` file in your new folder. A tool consists of two parts:
- **Definition**: The JSON schema that tells the LLM what the tool does and what parameters it accepts.
- **Executor**: An async function that performs the actual work.

```typescript
// src/server/agent/tools/definitions/my-new-tool/index.ts

export const myNewTool = {
  name: "my-new-tool",
  description: "Does something awesome.",
  parameters: {
    type: "object",
    properties: {
      input: { type: "string", description: "The user input" }
    },
    required: ["input"]
  },
  execute: async (args: { input: string }, context: any) => {
    // Implement your logic here
    return { result: "Awesome success!" };
  }
};
```

### 3. Register the Tool
Add your tool to `src/server/agent/tools/registry.ts`:

```typescript
// src/server/agent/tools/registry.ts
import { myNewTool } from "./definitions/my-new-tool";

// 1. Add to the tools schema array
export const tools: ToolDefinition[] = [
  // ...
  { 
    type: "function", 
    function: { 
      name: myNewTool.name, 
      description: myNewTool.description, 
      parameters: myNewTool.parameters 
    } 
  },
];

// 2. Add to the executors map
export const toolExecutors = {
  // ...
  [myNewTool.name]: myNewTool.execute,
};
```

### 4. Enable in Settings (Optional)
If you want the user to be able to toggle your tool on/off, add it to the filter logic in `src/server/agent/tools/filter.ts`:

```typescript
const toolMappings: Record<string, string> = {
  // ...
  myNewTool: "my-new-tool",
};
```

Then, ensure the key `myNewTool` is present in `DEFAULT_SETTINGS` in `src/features/settings/types.ts`.

---

## 🤖 Adding an AI Provider

Maya uses an OpenAI-compatible interface. To add a new provider:

1.  Open `src/lib/constants/services.ts` and register the service.
2.  The `src/server/agent/provider/index.ts` will automatically pick up the new provider if it uses the standard baseURL/apiKey pattern.
3.  If the provider requires custom logic, update `src/server/agent/utils/api-keys.ts` or the provider factory.

---
## ✨ Adding an Widget
### 1. Create the Widget Component
Create a new React component in `src/features/chat/components/widgets/`. 

#### Data Normalization
Maya's dispatcher (`ToolResultPart`) automatically maps the tool's raw output to the `data` field. This ensures consistency across all widgets.

```tsx
// src/features/chat/components/widgets/MyNewWidget.tsx
import { WidgetProps } from "./index";

export default function MyNewWidget({ part }: WidgetProps) {
  // 'data' is the object your tool's execute() function returned
  const data = part.data; 
  
  // Other useful fields in 'part':
  // - part.toolName:   The string ID of the tool
  // - part.toolCallId: The unique ID for this specific call
  // - part.isError:    Boolean indicating if the tool execution failed

  if (part.isError) {
    return <div className="text-destructive">Error loading data.</div>;
  }

  return (
    <div className="p-4 bg-secondary rounded-xl">
      <h3>{data.title || "Tool Result"}</h3>
      <p>{data.description}</p>
    </div>
  );
}
```

### 2. Register in the WIDGET_REGISTRY
Open `src/features/chat/components/widgets/index.ts` and add your tool's name to the registry. The key must **exactly match** the `name` property of your tool definition.

```typescript
// src/features/chat/components/widgets/index.ts
import MyNewWidget from "./MyNewWidget";

export const WIDGET_REGISTRY: Record<string, React.ComponentType<WidgetProps>> = {
  // ... existing widgets
  "my-new-tool": MyNewWidget,
};
```

### 3. Dispatch Mechanism
Maya uses a centralized dispatcher (`ToolResultPart.tsx`). When a tool execution finishes, the pipeline sends a `tool_result` event. The dispatcher looks up the `toolName` in the `WIDGET_REGISTRY` and renders the corresponding component automatically.

### 4. Direct the LLM (Prompt Engineering)
To prevent the AI from describing the data in text while the widget is visible, always include an `instructions` field in your tool's return object:

```typescript
return {
  ...data,
  instructions: "A specialized widget is showing these results. Do not repeat them in text."
};
```

---

> [!TIP]
> Always provide **`instructions`** in your tool's return value to guide the LLM on how to present the result to the user!
