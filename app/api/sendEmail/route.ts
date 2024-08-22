"use server";
import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import { VercelInviteUserEmail } from "@/components/EmailTemplate/Emailtemplate1";
import { AirbnbReviewEmail } from "@/components/EmailTemplate/airbnbtemplate";
import { KoalaWelcomeEmail } from "@/components/EmailTemplate/koalatemplate";
import { StackOverflowTipsEmail } from "@/components/EmailTemplate/stackoverflowTemplate";
import { YelpRecentLoginEmail } from "@/components/EmailTemplate/yelpTemplate";
const nodemailer = require("nodemailer");

export async function POST(req: any) {
  console.log("Submitted");
  try {
    const {
      subject,
      template,
      buttonLink,
      buttonText,
      name,
      clinicName,
      reason,
      startDate,
      endDate,
      email,
    } = await req.json();

    console.log(
      subject,
      template,
      buttonLink,
      buttonText,
      name,
      clinicName,
      reason,
      startDate,
      endDate,
      email
    );
    {
      email.map(async (email: any, index: any) => {
        const emailHtml = await render(
          KoalaWelcomeEmail({
            reason: reason,
            clinicName: clinicName,
            userFirstname: email.firstname,
            name: name,
            buttonText: buttonText,
            buttonLink: buttonLink,
            endDate: endDate,
            startDate: startDate,
          })
        );

        // Ensure that the required props are passed correctly

        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS_KEY,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL, // sender address
          to: email.email, // list of receivers
          subject: subject, // Subject line
          text: "", // plain text body
          html: emailHtml, // html body
        });
        console.log(`Email sent successfully ${email.email}`);
      });
    }
    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "An error occurred while sending email to the the user." },
      { status: 500 }
    );
  }
}
