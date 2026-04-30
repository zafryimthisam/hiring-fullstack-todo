import "./App.css";
import TaskIcon from "@mui/icons-material/Task";
import { useForm } from "react-hook-form";

function App() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
  } = useForm();
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
        <div>
          <form></form>
        </div>
      </div>
      <div>
        <h1 className="text-5xl font-bold text-(--color-main-text)">
          Things to get done
        </h1>
        <div className="min-h-96 w-[396.385] mt-14 rounded bg-[#E8F3FA] flex items-center">
          <p className="text-lg font-semibold text-(--color-info-text) text-center px-8 w-96">
            Currently you do not have any tasks to complete
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
