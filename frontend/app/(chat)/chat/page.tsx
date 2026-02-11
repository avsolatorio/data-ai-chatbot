import { redirect } from "next/navigation";
import { getAppPath } from "@/lib/config";

/**
 * /chat with no id: show home (new chat).
 * Redirect to base path root so /data360-chat/chat -> /data360-chat/.
 */
export default function ChatIndexPage() {
  redirect(getAppPath("/"));
}
