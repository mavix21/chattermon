import { bot } from "@/lib/bot";
import { after } from "next/server";

export async function GET(request: Request) {
  return bot.webhooks.telegram(request);
}

export async function POST(request: Request) {
  return bot.webhooks.telegram(request, {
    waitUntil: (task) => after(() => task),
  });
}
