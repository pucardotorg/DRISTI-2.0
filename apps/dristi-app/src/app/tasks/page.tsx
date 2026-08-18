import { Suspense } from "react";

import { TasksScreen, TasksScreenFallback } from "@/components/tasks/tasks-screen";

/** All pending tasks. `useSearchParams` needs a Suspense boundary above it. */
export default function TasksPage() {
  return (
    <Suspense fallback={<TasksScreenFallback />}>
      <TasksScreen />
    </Suspense>
  );
}
