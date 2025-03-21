import { NextResponse } from "next/server";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});


const phoneRegex = /^\+\d{11,15}$/;

export const POST = async (req: Request) => {
  try {
    const { phoneNumbers, message } = await req.json();

    // Validate phoneNumbers is an array and not empty
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid phone numbers array." },
        { status: 400 }
      );
    }

    // Validate each phone number
    const invalidNumbers = phoneNumbers.filter((num) => !phoneRegex.test(num));
    if (invalidNumbers.length > 0) {
      return NextResponse.json(
        { success: false, message: `Invalid phone numbers: ${invalidNumbers.join(", ")}` },
        { status: 400 }
      );
    }

    // Send SMS to all valid numbers
    const sendSmsPromises = phoneNumbers.map((phoneNumber) => {
      const command = new PublishCommand({
        Message: message,
        PhoneNumber: phoneNumber,
      });

      return snsClient.send(command);
     
    });

    await Promise.all(sendSmsPromises);

    return NextResponse.json(
      { success: true, message: "SMS sent successfully to all numbers!"},
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};



