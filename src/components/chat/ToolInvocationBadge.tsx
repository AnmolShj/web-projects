import { Loader2 } from "lucide-react";

interface StrReplaceEditorArgs {
  command?: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path?: string;
}

interface FileManagerArgs {
  command?: "rename" | "delete";
  path?: string;
  new_path?: string;
}

export interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
}

function getFileName(path: string | undefined): string {
  if (!path) return "";
  return path.split("/").pop() || path;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "str_replace_editor") {
    const { command, path } = args as StrReplaceEditorArgs;
    const fileName = getFileName(path);
    switch (command) {
      case "create":
        return `Creating ${fileName}`;
      case "str_replace":
      case "insert":
        return `Editing ${fileName}`;
      case "view":
        return `Reading ${fileName}`;
      case "undo_edit":
        return `Undoing edit in ${fileName}`;
      default:
        return fileName ? `Editing ${fileName}` : toolName;
    }
  }

  if (toolName === "file_manager") {
    const { command, path, new_path } = args as FileManagerArgs;
    const fileName = getFileName(path);
    switch (command) {
      case "delete":
        return `Deleting ${fileName}`;
      case "rename":
        return `Renaming ${fileName} to ${getFileName(new_path)}`;
      default:
        return fileName ? `Managing ${fileName}` : toolName;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { toolName, args, state } = toolInvocation;
  const isDone = state === "result";
  const label = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
