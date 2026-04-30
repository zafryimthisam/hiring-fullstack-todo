import "./App.css";
import TaskIcon from "@mui/icons-material/Task";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";

function App() {
  const [todos, setTodos] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/");
        setTodos(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const todoSchema = z.object({
    title: z
      .string()
      .min(3, "Title must be minimum 3 characters")
      .max(50, "Title exceeded the max length"),
    description: z.string().min(3, "Description must be minimum 3 characters"),
  });
  type todoType = z.infer<typeof todoSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<todoType>({
    defaultValues: {
      title: "",
      description: "",
    },
    resolver: zodResolver(todoSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: todoType) => {
    try {
      await axios.post("http://localhost:3000/api/todos", data);
      console.log("Form Submitted");
      console.log(data);
      reset();
    } catch (error) {
      console.log("Failed to create todo:", error);
    }
  };

  return (
    <div className="flex justify-between">
      <div>
        <p className="text-(--color-sub-text) tracking-[0.4em]">WELCOME USER</p>
        <h1 className="text-7xl font-bold text-(--color-main-text) flex items-center">
          TODO APP <TaskIcon sx={{ fontSize: 60, marginLeft: 2 }} />
        </h1>
        <p className="text-(--color-p-text) text-2xl">
          Organize your tasks, focus on what matters.
        </p>
        <div className="mt-5">
          <Card className="w-full max-w-sm bg-[#FEF5ED]">
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
                />
                {errors.title && (
                  <p className="text-red-500">{`${errors.title.message}`}</p>
                )}
                <Label className="my-2">Description</Label>
                <Textarea
                  aria-invalid={errors.description ? "true" : "false"}
                  {...register("description")}
                  id="description"
                  placeholder="Type your to-do description here"
                />
                {errors.description && (
                  <p className="text-red-500">{`${errors.description?.message}`}</p>
                )}
                <Button
                  disabled={isSubmitting}
                  className="mt-2 w-fit py-4 self-end cursor-pointer"
                  type="submit"
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <div>
        <h1 className="text-5xl font-bold text-(--color-main-text)">
          Things to get done
        </h1>
        <div className="min-h-96 w-[396.385] mt-14 rounded-2xl border bg-[#E8F3FA] flex items-center">
          <p className="text-lg font-semibold text-(--color-info-text) text-center px-8 w-96">
            Currently you do not have any tasks to complete
          </p>
        </div>
        <p>{todos}</p>
      </div>
    </div>
  );
}

export default App;
