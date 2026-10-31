import { MessageBoardScreen } from "@/components";

/** Teacher message board — the shared, role-agnostic board (posts as "Teacher"). */
export default function TeacherMessages() {
  return <MessageBoardScreen posterRole="Teacher" />;
}
