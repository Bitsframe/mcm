import { NextResponse } from "next/server";
export async function GET(req: any) {
  try {
    return NextResponse.json({ message: "getting the user." }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred while getting the user." },
      { status: 500 }
    );
  }
}
