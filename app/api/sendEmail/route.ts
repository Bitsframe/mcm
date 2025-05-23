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


export async function POST(req: any) {
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
      email,
      price
    } = await req.json();

    console.log("Received email request:", {
      subject,
      template,
      templateBody: !!templateBody,
      recipientCount: email?.length,
      hasRequiredFields: !!subject && !!name && !!price
    });

    // Validate required fields
    if (!subject || !name || !price) {
      return NextResponse.json(
        { message: "Missing required fields: subject, name, or price" },
        { status: 400 }
      );
    }

    // Validate email recipients
    if (!email || !Array.isArray(email) || email.length === 0) {
      return NextResponse.json(
        { message: "No valid email recipients provided" },
        { status: 400 }
      );
    }

    // If templateBody is provided, use it directly (DB template)
    if (templateBody) {
      const payload = {
        from: process.env.SENDER_BROADCAST_EMAIL || "test@alerts.myclinicmd.com",
        recipients: email.map((recipient: any) => recipient.email),
        subject,
        html: templateBody,
      };

      console.log("Sending email payload (DB template):", {
        from: payload.from,
        recipientCount: payload.recipients.length,
        subject: payload.subject
      });

      const endpoint = `${process.env.NEXT_PUBLIC_EMAIL_SENDER_URL}/send-batch-email` || "https://send-resent-mail-646827ff1a0b.herokuapp.com/send-batch-email";

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Email service response (DB template):", {
        status: response.status,
        data: response.data
      });

      if (response.status !== 200) {
        throw new Error(response.data?.message || 'Failed to send email');
      }

      return NextResponse.json(
        { message: "Emails sent successfully", ok: true },
        { status: 201 }
      );
    }

    // Only validate template name for hardcoded templates
    const selectedTemplate = templates.find((t) => t.value === template);
    if (!selectedTemplate) {
      return NextResponse.json(
        { message: "Invalid template name provided." },
        { status: 400 }
      );
    }

    const emailHtmls = render(
      selectedTemplate.component({
        reason,
        clinicName,
        name,
        buttonText,
        buttonLink,
        endDate,
        startDate,
        price,
      })
    );

    // Create a payload that includes all recipients
    const payload = {
      from: process.env.SENDER_BROADCAST_EMAIL || "test@alerts.myclinicmd.com",
      recipients: email.map((recipient: any) => recipient.email),
      subject,
      html: emailHtmls,
    };

    console.log("Sending email payload (hardcoded):", {
      from: payload.from,
      recipientCount: payload.recipients.length,
      subject: payload.subject
    });

    const endpoint = `${process.env.NEXT_PUBLIC_EMAIL_SENDER_URL}/send-batch-email` || "https://send-resent-mail-646827ff1a0b.herokuapp.com/send-batch-email";

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Email service response (hardcoded):", {
      status: response.status,
      data: response.data
    });

    if (response.status !== 200) {
      throw new Error(response.data?.message || 'Failed to send email');
    }

    return NextResponse.json(
      { message: "Emails sent successfully", ok: true },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Email sending error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    return NextResponse.json(
      { 
        message: error.message || "An error occurred while sending emails.",
        error: error.response?.data || error.message,
        details: error.response?.data?.details || "No additional details available"
      },
      { status: 500 }
    );
  }
}