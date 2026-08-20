import { TaskActPage } from "@/components/tasks/act/act-page";

/**
 * Continue a draft — interim page for the e-filing flow (v2.2). Renders the draft's
 * experience by kind: a sign-kind draft signs, everything else files.
 */
export default function Page() {
  return <TaskActPage action="continue" />;
}
