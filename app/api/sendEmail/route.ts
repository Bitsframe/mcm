"use server";
import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import emailtemplate1 from "@/components/EmailTemplate/template1";
import emailtemplate2 from "@/components/EmailTemplate/template2";
import emailtemplate3 from "@/components/EmailTemplate/template3";
import emailtemplate4 from "@/components/EmailTemplate/template4";
import emailtemplate5 from "@/components/EmailTemplate/template5";
import emailtemplate6 from "@/components/EmailTemplate/template6";
import emailtemplate7 from "@/components/EmailTemplate/template7";
import emailtemplate8 from "@/components/EmailTemplate/template8";
import emailtemplate9 from "@/components/EmailTemplate/template9";
import emailtemplate10 from "@/components/EmailTemplate/template10";
import axios from "axios";

const templates = [
  { label: "Template 1", value: "template1", component: emailtemplate1 },
  { label: "Template 2", value: "template2", component: emailtemplate2 },
  { label: "Template 3", value: "template3", component: emailtemplate3 },
  { label: "Template 4", value: "template4", component: emailtemplate4 },
  { label: "Template 5", value: "template5", component: emailtemplate5 },
  { label: "Template 6", value: "template6", component: emailtemplate6 },
  { label: "Template 7", value: "template7", component: emailtemplate7 },
  { label: "Template 8", value: "template8", component: emailtemplate8 },
  { label: "Template 9", value: "template9", component: emailtemplate9 },
  { label: "Template 10", value: "template10", component: emailtemplate10 },
];

export async function POST(req: Request) {
  try {
    const {
      subject,
      template,
      templateBody,
      buttonLink,
      buttonText,
      name,
      clinicName,
      reason,
      startDate,
      endDate,
      email: recipients,
      price,
    } = await req.json();

    if (!subject || !name || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!templateBody && !price) {
      return NextResponse.json({ message: "Price required for template" }, { status: 400 });
    }

    const endpoint = process.env.NEXT_PUBLIC_EMAIL_SENDER_URL;

    if (!endpoint) {
      return NextResponse.json({ message: "Email service not configured" }, { status: 500 });
    }

    let htmlContent = "";

    if (templateBody) {
      htmlContent = templateBody;
    } else {
      const selected = templates.find(t => t.value === template);
      if (!selected) {
        return NextResponse.json({ message: "Invalid template" }, { status: 400 });
      }
      htmlContent = render(selected.component({
        reason, clinicName, name, buttonText, buttonLink, endDate, startDate, price,
      }));
    }

    const payload = {
      from: process.env.SENDER_BROADCAST_EMAIL || "MyClinicMD <no-reply@alerts.myclinicmd.com>",
      recipients: recipients.map((r: any) => r.email || r),
      subject,
      html: htmlContent,
    };

    const response = await axios.post(endpoint, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 60000,
    });

    return NextResponse.json(
      { message: "Emails sent successfully!", ok: true, data: response.data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Email API Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        message: "Failed to send emails",
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}