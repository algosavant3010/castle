import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/wallets/name?owner=<address>
 * Returns all vault names for a given owner.
 */
export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner");
  if (!owner) {
    return NextResponse.json({ error: "Missing owner param" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("vaults")
    .select("address, agent_name")
    .eq("owner_address", owner.toLowerCase());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return as a record: { [address]: name }
  const names: Record<string, string> = {};
  for (const row of data || []) {
    if (row.agent_name) {
      names[row.address.toLowerCase()] = row.agent_name;
    }
  }

  return NextResponse.json(names);
}

/**
 * POST /api/wallets/name
 * Body: { address: string, ownerAddress: string, name: string }
 * Upserts the vault name in Supabase.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, ownerAddress, name } = body;

  if (!address || !ownerAddress || !name) {
    return NextResponse.json(
      { error: "Missing address, ownerAddress, or name" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("vaults").upsert(
    {
      address: address.toLowerCase(),
      owner_address: ownerAddress.toLowerCase(),
      agent_name: name,
    },
    { onConflict: "address" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
