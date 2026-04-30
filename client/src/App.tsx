import "./App.css";
import TaskIcon from "@mui/icons-material/Task";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
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
  const titleInputRef = useRef<HTMLInputElement>(null);

  const todoBgColors = ["#CC8140", "#51ACB4", "#1C8CCE", "#E08AA3"];

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => Number(a.done) - Number(b.done));
  }, [todos]);

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

  // Focus title input when entering edit mode
  useEffect(() => {
    if (editingId) {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
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
    if (editTitle.trim().length < 3)
      errs.title = "Title must be minimum 3 characters";
    if (editTitle.trim().length > 50)
      errs.title = "Title exceeded the max length";
    if (editDescription.trim().length < 3)
      errs.description = "Description must be minimum 3 characters";
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
        () => setWiggleId((current) => (current === id ? null : current)),
        450,
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      setWiggleId(null);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex justify-between gap-10">
      {/* LEFT — form */}
      <div>
        <p className="text-(--color-sub-text) tracking-[0.4em]">WELCOME USER</p>
        <h1 className="text-7xl font-bold text-(--color-main-text) flex items-center">
          TODO APP <TaskIcon sx={{ fontSize: 60, marginLeft: 2 }} />
        </h1>
        <p className="text-(--color-p-text) text-2xl">
          Organize your tasks, focus on what matters.
        </p>
        <div className="mt-5">
          <Card className="w-full max-w-sm bg-[#FEF5ED] border border-black/5 shadow-sm">
            <CardHeader>
              <CardTitle>Add a task</CardTitle>
              <CardDescription>
                Fill out the below form with a title and a description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-1"
              >
                <Label className="my-2" htmlFor="title">
                  Title
                </Label>
                <Input
                  aria-invalid={errors.title ? "true" : "false"}
                  {...register("title")}
                  id="title"
                  type="text"
                  placeholder="Enter a title"
                  className="aria-invalid:border-red-500 aria-invalid:ring-red-500"
                />
                {errors.title && (
                  <p className="text-red-500">{errors.title.message}</p>
                )}
                <Label className="my-2" htmlFor="description">
                  Description
                </Label>
                <Textarea
                  aria-invalid={errors.description ? "true" : "false"}
                  {...register("description")}
                  id="description"
                  placeholder="Type your to-do description here"
                  className="aria-invalid:border-red-500 aria-invalid:ring-red-500"
                />
                {errors.description && (
                  <p className="text-red-500">{errors.description.message}</p>
                )}
                <Button
                  disabled={isSubmitting}
                  className="mt-2 w-fit py-4 self-end cursor-pointer hover:scale-110"
                  type="submit"
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RIGHT — todo list */}
      <div className="min-w-[430px]">
        <h1 className="text-5xl font-bold text-(--color-main-text)">
          Things to get done
        </h1>
        <div
          className={`min-h-96 w-[396.385px] mt-14 rounded-2xl border bg-neutral-100 flex ${
            todos.length === 0 ? "items-center bg-[#E8F3FA] justify-center" : ""
          }`}
        >
          {todos.length === 0 ? (
            <p className="text-lg font-semibold text-(--color-info-text) text-center px-8 w-96">
              Currently you do not have any tasks to complete
            </p>
          ) : (
            <div className="w-full px-3 py-3 max-h-[28rem] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent">
              {sortedTodos.map((todo, index) => {
                const bgColor = todoBgColors[index % todoBgColors.length];
                const isEditing = editingId === todo._id;

                return (
                  <div
                    key={todo._id}
                    onDoubleClick={() =>
                      !isEditing && !todo.done && startEditing(todo)
                    }
                    className={`rounded-2xl px-3 py-3 text-white shadow-sm transition-transform duration-200 ${
                      wiggleId === todo._id ? "todo-wiggle" : ""
                    } ${todo.done ? "opacity-75" : ""} ${
                      !isEditing && !todo.done
                        ? "cursor-pointer select-none"
                        : ""
                    }`}
                    style={{ backgroundColor: bgColor }}
                  >
                    {isEditing ? (
                      /* ── IN-PLACE EDIT MODE ── */
                      <div className="flex flex-col gap-2">
                        <input
                          ref={titleInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") cancelEditing();
                          }}
                          className="w-full rounded-lg px-2 py-1 text-sm font-bold text-black bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60"
                          placeholder="Title"
                        />
                        {editErrors.title && (
                          <p className="text-xs text-yellow-200">
                            {editErrors.title}
                          </p>
                        )}
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") cancelEditing();
                          }}
                          rows={3}
                          className="w-full rounded-lg px-2 py-1 text-sm text-black bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60 resize-none"
                          placeholder="Description"
                        />
                        {editErrors.description && (
                          <p className="text-xs text-yellow-200">
                            {editErrors.description}
                          </p>
                        )}
                        <div className="flex justify-end gap-2 mt-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                            aria-label="Cancel edit"
                          >
                            <CloseIcon fontSize="small" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveEdit(todo._id)}
                            disabled={isSaving}
                            className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                            aria-label="Save edit"
                          >
                            <CheckIcon fontSize="small" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <Checkbox
                            checked={todo.done}
                            onCheckedChange={() => onToggleDone(todo._id)}
                            disabled={loadingId === todo._id}
                            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-lg font-bold leading-tight ${
                              todo.done ? "line-through decoration-2" : ""
                            }`}
                          >
                            {todo.title}
                          </h3>
                          <p
                            className={`mt-1 text-sm/6 text-white/90 break-words ${
                              todo.done ? "line-through decoration-2" : ""
                            }`}
                          >
                            {todo.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!todo.done && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                              onClick={() => startEditing(todo)}
                              disabled={loadingId === todo._id}
                              aria-label="Edit todo"
                            >
                              <EditIcon fontSize="small" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                            onClick={() => onDeleteTodo(todo._id)}
                            disabled={loadingId === todo._id}
                            aria-label="Delete todo"
                          >
                            <DeleteIcon fontSize="small" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-(--color-sub-text) text-center">
          Double-click a card to edit it
        </p>
      </div>
    </div>
  );
}

export default App;
