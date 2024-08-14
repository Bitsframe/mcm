"use server";
import { render } from "@react-email/components";
import { VercelInviteUserEmail } from "@/components/EmailTemplate/Emailtemplate1";
import { AirbnbReviewEmail } from "@/components/EmailTemplate/airbnbtemplate";
import { KoalaWelcomeEmail } from "@/components/EmailTemplate/koalatemplate";
import { StackOverflowTipsEmail } from "@/components/EmailTemplate/stackoverflowTemplate";
import { YelpRecentLoginEmail } from "@/components/EmailTemplate/yelpTemplate";
const nodemailer = require("nodemailer");
const emailList = [
  "raheelhussainco@gmail.com",
  "raheelofficialco@gmail.com",
  "raheelandcompany@gmail.com",
  "raheelconnect@gmail.com",
];
export async function sendEmail(formData: FormData) {
  // console.log("Email :", email);
  let subject = formData.get("subject") as string;
  let template = formData.get("template") as string;
  let buttonLink = formData.get("buttonLink") as string;
  try {
    // Choose the email HTML based on the emailOption
    let emailHtml;
    switch (template) {
      case "1":
        emailHtml = render(<VercelInviteUserEmail />);
        break;
      case "2":
        emailHtml = render(<AirbnbReviewEmail />);
        break;
      case "3":
        emailHtml = render(<KoalaWelcomeEmail />);
        break;
      case "4":
        emailHtml = render(<StackOverflowTipsEmail />);
        break;
      case "5":
        emailHtml = render(<YelpRecentLoginEmail />);
        break;
      default:
        emailHtml = render(<YelpRecentLoginEmail />);
    }
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
    {
      emailList.map(async (email: any, index: any) => {
        await transporter.sendMail({
          from: process.env.EMAIL, // sender address
          to: email, // list of receivers
          subject: subject, // Subject line
          text: "", // plain text body
          html: emailHtml, // html body
        });
        console.log(`Email sent successfully ${email}`);
      });
    }
  } catch (error) {
    console.log(error);
  }
}
