import { streamText } from "ai"
import { google } from "@ai-sdk/google"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system:
        "You are the Game Hub AI Assistant. You are an expert on all the games in this hub (Sudoku, Snake, 2048, Memory, Tic-Tac-Toe, Mine Hunter, F1 Racing). You provide helpful tips, explain rules clearly, and offer encouragement. You are witty, friendly, and concise. If asked about games not in the hub, politely steer the conversation back to the available games.",
      messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("AI Chat Error:", error)
    return new Response("Error processing chat request", { status: 500 })
  }
}
