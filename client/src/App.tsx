import "./App.css";
import TaskIcon from "@mui/icons-material/Task";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Todo = {
  _id: string;
  title: string;
  description: string;
  done: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const todoSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be minimum 3 characters")
    .max(50, "Title exceeded the max length"),
  description: z.string().min(3, "Description must be minimum 3 characters"),
});

type TodoFormValues = z.infer<typeof todoSchema>;
const API_BASE = "http://localhost:3000";

// ── Content-aware column span ──────────────────────────────────────────────
// Returns a col-span based on combined character length of title + description.
// We also carry forward a "remaining columns" budget per row so cards pack
// tightly without awkward orphan gaps.
function getColSpan(title: string, description: string): number {
  const total = title.length + description.length;
  if (total <= 60) return 4; // short  → compact square
  if (total <= 120) return 6; // medium → half width
  if (total <= 200) return 8; // long   → wide
  return 12; // very long → full row
}

// Build a layout plan: pack cards into 12-col rows, never leaving a gap > 3.
// Returns array of col-span numbers parallel to the todos array.
function buildLayout(todos: Todo[]): number[] {
  const spans: number[] = [];
  let rowUsed = 0;

  todos.forEach((todo) => {
    let span = getColSpan(todo.title, todo.description);

    // If it doesn't fit in the remaining space, either stretch to fill or bump to next row
    const remaining = 12 - rowUsed;
    if (span > remaining) {
      if (remaining >= 4) {
        // Stretch current card to fill the row rather than leave a gap
        span = remaining;
      } else {
        // Tiny leftover — pad with a ghost span (handled below) and start fresh
        spans.push(-remaining); // negative = filler slot
        rowUsed = 0;
        span = getColSpan(todo.title, todo.description);
      }
    }

    spans.push(span);
    rowUsed = (rowUsed + span) % 12;
  });

  return spans;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editErrors, setEditErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const todoBgColors = ["#CC8140", "#51ACB4", "#1C8CCE", "#E08AA3"];

  const sortedTodos = useMemo(
    () => [...todos].sort((a, b) => Number(a.done) - Number(b.done)),
    [todos],
  );

  const pendingCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.filter((t) => t.done).length;

  // Recompute layout whenever sorted todos change
  const layoutSpans = useMemo(() => buildLayout(sortedTodos), [sortedTodos]);

  const fetchTodos = async () => {
    try {
      const response = await axios.get<Todo[]>(`${API_BASE}/api/todos`);
      setTodos(response.data);
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);
  useEffect(() => {
    if (editingId) setTimeout(() => titleInputRef.current?.focus(), 50);
  }, [editingId]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TodoFormValues>({
    defaultValues: { title: "", description: "" },
    resolver: zodResolver(todoSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: TodoFormValues) => {
    try {
      await axios.post(`${API_BASE}/api/todos`, data);
      reset();
      setShowForm(false);
      await fetchTodos();
    } catch (error) {
      console.log("Failed to create todo:", error);
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo._id);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditErrors({});
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditErrors({});
  };

  const validateEdit = () => {
    const errs: { title?: string; description?: string } = {};
    if (editTitle.trim().length < 3) errs.title = "Min 3 characters";
    if (editTitle.trim().length > 50) errs.title = "Max 50 characters";
    if (editDescription.trim().length < 3)
      errs.description = "Min 3 characters";
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveEdit = async (id: string) => {
    if (!validateEdit()) return;
    try {
      setIsSaving(true);
      await axios.put(`${API_BASE}/api/todos/${id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setEditingId(null);
      await fetchTodos();
    } catch (error) {
      console.error("Failed to update todo:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const onDeleteTodo = async (id: string) => {
    try {
      setLoadingId(id);
      await axios.delete(`${API_BASE}/api/todos/${id}`);
      await fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const onToggleDone = async (id: string) => {
    try {
      setLoadingId(id);
      setWiggleId(id);
      await axios.patch(`${API_BASE}/api/todos/${id}/done`);
      await fetchTodos();
      window.setTimeout(
        () => setWiggleId((cur) => (cur === id ? null : cur)),
        450,
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      setWiggleId(null);
    } finally {
      setLoadingId(null);
    }
  };

  // Interleave filler divs and todo cards based on layoutSpans
  const renderCards = () => {
    const elements: React.ReactNode[] = [];
    let todoIdx = 0;

    layoutSpans.forEach((span, i) => {
      if (span < 0) {
        // Filler slot to close out a row
        elements.push(
          <div
            key={`filler-${i}`}
            style={{ gridColumn: `span ${Math.abs(span)}` }}
          />,
        );
        return;
      }

      const todo = sortedTodos[todoIdx++];
      if (!todo) return;

      const bgColor = todoBgColors[todoIdx % todoBgColors.length];
      const isEditing = editingId === todo._id;
      const contentLen = todo.title.length + todo.description.length;
      // Taller min-height for longer content
      const minH =
        contentLen > 200
          ? "min-h-[200px]"
          : contentLen > 100
            ? "min-h-[170px]"
            : "min-h-[140px]";

      elements.push(
        <div
          key={todo._id}
          style={{ backgroundColor: bgColor, gridColumn: `span ${span}` }}
          onDoubleClick={() => !isEditing && !todo.done && startEditing(todo)}
          className={`rounded-3xl p-5 text-white shadow-sm relative overflow-hidden transition-all duration-200 flex flex-col justify-between ${minH} ${
            wiggleId === todo._id ? "todo-wiggle" : ""
          } ${todo.done ? "opacity-60" : ""} ${
            !isEditing && !todo.done
              ? "cursor-pointer hover:brightness-105 hover:scale-[1.01]"
              : ""
          }`}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white pointer-events-none" />
          <div className="absolute -bottom-8 -left-4 w-36 h-36 rounded-full opacity-10 bg-white pointer-events-none" />

          {isEditing ? (
            <div className="flex flex-col gap-2 relative z-10">
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") cancelEditing();
                }}
                className="w-full rounded-xl px-3 py-1.5 text-sm font-bold text-black bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60"
                placeholder="Title"
              />
              {editErrors.title && (
                <p className="text-xs text-yellow-200">{editErrors.title}</p>
              )}
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") cancelEditing();
                }}
                rows={3}
                className="w-full rounded-xl px-3 py-1.5 text-sm text-black bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60 resize-none"
                placeholder="Description"
              />
              {editErrors.description && (
                <p className="text-xs text-yellow-200">
                  {editErrors.description}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={cancelEditing}
                  className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                >
                  <CloseIcon fontSize="small" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => saveEdit(todo._id)}
                  disabled={isSaving}
                  className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                >
                  <CheckIcon fontSize="small" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between relative z-10">
                <Checkbox
                  checked={todo.done}
                  onCheckedChange={() => onToggleDone(todo._id)}
                  disabled={loadingId === todo._id}
                  className="border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-black mt-0.5"
                />
              </div>
              <div className="relative z-10 mt-3 flex-1">
                <h3
                  className={`font-bold leading-snug ${
                    span >= 8 ? "text-xl" : span >= 6 ? "text-lg" : "text-base"
                  } ${todo.done ? "line-through decoration-2 opacity-80" : ""}`}
                >
                  {todo.title}
                </h3>
                <p
                  className={`mt-1 text-white/85 leading-relaxed ${
                    span >= 8 ? "text-sm" : "text-xs"
                  } ${todo.done ? "line-through decoration-2" : ""}`}
                >
                  {todo.description}
                </p>
              </div>
              <div className="relative z-10 mt-4 flex items-center justify-between">
                {todo.done ? (
                  <span className="text-xs bg-white/20 text-white/90 rounded-full px-3 py-0.5 font-medium">
                    ✓ Done
                  </span>
                ) : (
                  <span className="text-xs text-white/50 font-mono">
                    #{String(todoIdx).padStart(2, "0")}
                  </span>
                )}
                <div className="flex gap-1">
                  {!todo.done && (
                    <button
                      onClick={() => startEditing(todo)}
                      disabled={loadingId === todo._id}
                      className="h-7 w-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
                      aria-label="Edit"
                    >
                      <EditIcon sx={{ fontSize: 14 }} />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteTodo(todo._id)}
                    disabled={loadingId === todo._id}
                    className="h-7 w-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
                    aria-label="Delete"
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>,
      );
    });

    return elements;
  };

  return (
    <div className="min-h-screen p-8">
      {/* ── HEADER ── */}
      <div className="mb-8">
        <p className="text-(--color-sub-text) tracking-[0.4em] text-sm mb-1">
          WELCOME USER
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-6xl font-bold text-(--color-main-text) flex items-center gap-3">
            TODO APP <TaskIcon sx={{ fontSize: 52 }} />
          </h1>
          <p className="text-(--color-p-text) text-lg max-w-xs text-right">
            Organize your tasks,
            <br />
            focus on what matters.
          </p>
        </div>
      </div>

      {/* ── BENTO GRID ── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Pending stat */}
        <div className="col-span-3 rounded-3xl bg-[#1C8CCE] text-white p-6 flex flex-col justify-between min-h-[140px]">
          <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">
            Pending
          </p>
          <div>
            <p className="text-6xl font-black leading-none">{pendingCount}</p>
            <p className="text-white/80 text-sm mt-1">tasks remaining</p>
          </div>
        </div>

        {/* Completed stat */}
        <div className="col-span-3 rounded-3xl bg-[#51ACB4] text-white p-6 flex flex-col justify-between min-h-[140px]">
          <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">
            Completed
          </p>
          <div>
            <p className="text-6xl font-black leading-none">{doneCount}</p>
            <p className="text-white/80 text-sm mt-1">tasks done</p>
          </div>
        </div>

        {/* Add task card */}
        <div className="col-span-6 rounded-3xl bg-[#FEF5ED] border border-black/5 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-lg text-(--color-main-text)">
                Add a task
              </h2>
              <p className="text-xs text-(--color-sub-text)">
                Fill in a title and description
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm((v) => !v);
                reset();
              }}
              className={`h-9 w-9 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow ${
                showForm ? "bg-[#E08AA3] rotate-45" : "bg-[#CC8140]"
              }`}
              aria-label="Toggle form"
            >
              <AddIcon fontSize="small" />
            </button>
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${showForm ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-2 pt-1"
            >
              <div className="px-2">
                <Label
                  htmlFor="title"
                  className="text-xs font-semibold text-(--color-sub-text) uppercase tracking-wide"
                >
                  Title
                </Label>
                <Input
                  aria-invalid={errors.title ? "true" : "false"}
                  {...register("title")}
                  id="title"
                  type="text"
                  placeholder="Enter a title"
                  className="mt-1 aria-invalid:border-red-500 aria-invalid:ring-red-500"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="px-2">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold text-(--color-sub-text) uppercase tracking-wide"
                >
                  Description
                </Label>
                <Textarea
                  aria-invalid={errors.description ? "true" : "false"}
                  {...register("description")}
                  id="description"
                  placeholder="What needs to be done?"
                  className="mt-1 resize-none aria-invalid:border-red-500 aria-invalid:ring-red-500"
                  rows={2}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <Button
                disabled={isSubmitting}
                className="self-end mt-1 cursor-pointer"
                type="submit"
              >
                {isSubmitting ? "Adding..." : "Add task"}
              </Button>
            </form>
          </div>
          {!showForm && (
            <p className="text-sm text-(--color-sub-text) mt-auto pt-2">
              Click{" "}
              <span className="font-semibold text-(--color-main-text)">+</span>{" "}
              to add a new task.
            </p>
          )}
        </div>

        {/* ── TODO CARDS ── */}
        {todos.length === 0 ? (
          <div className="col-span-12 rounded-3xl bg-[#E8F3FA] border border-black/5 flex items-center justify-center min-h-[200px]">
            <p className="text-lg font-semibold text-(--color-info-text) text-center px-8">
              No tasks yet — hit <span className="font-bold">+</span> above to
              add your first one!
            </p>
          </div>
        ) : (
          <>
            <div className="col-span-12 flex items-center gap-3 px-1 -mb-1">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-sub-text)">
                Things to get done
              </h2>
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-xs text-(--color-sub-text)">
                double-click to edit
              </span>
            </div>
            {renderCards()}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
