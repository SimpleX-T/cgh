import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/models/Match";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: any = {};
    if (status) {
      query.status = status;
    } else {
      // Default to waiting and active
      query.status = { $in: ["waiting", "active"] };
    }

    const matches = await Match.find(query)
      .populate("players.userId", "username avatar walletAddress")
      .sort({ createdAt: -1 });

    return NextResponse.json({ matches }, { status: 200 });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
