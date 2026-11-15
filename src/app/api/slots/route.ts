import { NextResponse, type NextRequest } from "next/server";
import { getSlots } from "@/lib/booking";

// GET /api/slots?business=<id>&service=<id>&date=YYYY-MM-DD[&staff=<id>]
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const business = p.get("business");
  const service = p.get("service");
  const date = p.get("date");
  if (!business || !service || !date) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const slots = await getSlots(business, service, date, p.get("staff") || null);
  if (slots === null) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}
