import { requireUser } from '@/utils/server/require-auth';
import { NextResponse } from "next/server";
import { classifyError } from '@/utils/logging/safe-log';
import { getServiceRoleSupabase } from "@/utils/supabase/service-role-client";

// Get specials (all or single)
export const GET = async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const gate = await requireUser();
  if (gate.response) return gate.response;

	try {
		const supabase = getServiceRoleSupabase();
		const { id } = await params;

		if (id === "all") {
			const { data, error } = await supabase
				.from("special_picture")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;

			return NextResponse.json({ success: true, data }, { status: 200 });
		}

		const { data, error } = await supabase
			.from("special_picture")
			.select("*")
			.eq("id", id)
			.single();

		if (error) throw error;

		return NextResponse.json({ success: true, data }, { status: 200 });
	} catch (error: any) {
		console.error("Error fetching specials:", classifyError(error));
		return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
	}
};

// Create (insert) special
export const POST = async (req: Request) => {
  const gate = await requireUser();
  if (gate.response) return gate.response;

	try {
		const supabase = getServiceRoleSupabase();
		const body = await req.json();
		const { file_path, display = false, title = null } = body;

		if (!file_path) {
			return NextResponse.json({ message: "file_path is required" }, { status: 400 });
		}

		const { data, error } = await supabase
			.from("special_picture")
			.insert({ file_path, display, title })
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ success: true, data }, { status: 201 });
	} catch (error: any) {
		console.error("Error creating special:", classifyError(error));
		return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
	}
};

// Update special
export const PUT = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const gate = await requireUser();
  if (gate.response) return gate.response;

	try {
		const supabase = getServiceRoleSupabase();
		const { id } = await params;
		const body = await req.json();
		const { file_path, display, title } = body;

		const updatePayload: Record<string, any> = {};
		if (typeof file_path !== "undefined") updatePayload.file_path = file_path;
		if (typeof display !== "undefined") updatePayload.display = display;
		if (typeof title !== "undefined") updatePayload.title = title;

		const { data, error } = await supabase
			.from("special_picture")
			.update(updatePayload)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ success: true, data }, { status: 200 });
	} catch (error: any) {
		console.error("Error updating special:", classifyError(error));
		return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
	}
};

// Delete special
export const DELETE = async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const gate = await requireUser();
  if (gate.response) return gate.response;

	try {
		const supabase = getServiceRoleSupabase();
		const { id } = await params;

		const { data, error } = await supabase
			.from("special_picture")
			.delete()
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ success: true, data }, { status: 200 });
	} catch (error: any) {
		console.error("Error deleting special:", classifyError(error));
		return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
	}
};
