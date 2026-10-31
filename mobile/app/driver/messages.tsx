import { MessageBoardScreen } from "@/components";

/** Driver message board — the shared, role-agnostic board (posts as "Driver"). */
export default function DriverMessages() {
  return <MessageBoardScreen posterRole="Driver" />;
}
