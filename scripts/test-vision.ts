/**
 * Raw vision test — send photos to Claude with zero context.
 * Run: npx tsx scripts/test-vision.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const urls = [
  "https://vis.iaai.com/resizer?imageKeys=45087871~SID~B746~S0~I1~RW2576~H1932~TH0&width=1024&height=768",
  "https://vis.iaai.com/resizer?imageKeys=45087871~SID~B746~S0~I2~RW2576~H1932~TH0&width=1024&height=768",
  "https://vis.iaai.com/resizer?imageKeys=45087871~SID~B746~S0~I3~RW2576~H1932~TH0&width=1024&height=768",
  "https://vis.iaai.com/resizer?imageKeys=45087871~SID~B746~S0~I4~RW2576~H1932~TH0&width=1024&height=768",
];

async function fetchBase64(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" }
  });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  const b64 = Buffer.from(buf).toString("base64");
  return b64.length > 1000 ? b64 : null;
}

async function main() {
  console.log("Downloading 5 photos...");
  const images = await Promise.all(urls.map(fetchBase64));
  const valid = images.filter(Boolean) as string[];
  console.log(`Got ${valid.length} images\n`);

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  for (let i = 0; i < valid.length; i++) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: valid[i] }
    });
  }
  content.push({
    type: "text",
    text: "Look at these photos of a car at a salvage auction. Describe ONLY the damage you can actually see in the photos. For each damaged area, say which photo number shows it (photo 1, 2, 3, etc left to right). If a panel or area looks clean and undamaged, explicitly say so. Be honest — don't invent damage you can't see."
  });

  console.log("Asking Claude (no listing context, just photos)...\n");
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    temperature: 0,
    messages: [{ role: "user", content }],
  });

  const text = response.content.find(b => b.type === "text");
  if (text && text.type === "text") console.log(text.text);
}

main().catch(console.error);
