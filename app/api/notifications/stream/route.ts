import { auth } from "@/auth";
import { subscribeToNotificationEvents } from "@/lib/realtime-notifications";

function encodeSseChunk(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const subscriberId = crypto.randomUUID();
      const encoder = new TextEncoder();

      controller.enqueue(
        encoder.encode(
          encodeSseChunk({
            kind: "connected",
            userId: session.user.id,
          }),
        ),
      );

      unsubscribe = subscribeToNotificationEvents(session.user.id, {
        id: subscriberId,
        send(event) {
          controller.enqueue(encoder.encode(encodeSseChunk(event)));
        },
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);
    },
    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      unsubscribe?.();
      return undefined;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
