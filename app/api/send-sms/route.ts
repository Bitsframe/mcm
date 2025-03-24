import { NextResponse } from "next/server";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});


export const POST = async (req: Request) => {
  try {
    const { phoneNumbers, message } = await req.json();

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid phone numbers array." },
        { status: 400 }
      );
    }

    // Normalize and Validate Phone Numbers
    const normalizedNumbers = phoneNumbers.map((num) => {
      let cleanedNum = num.replace(/\D/g, ""); // Remove all non-numeric characters

      if (cleanedNum.startsWith("92") && cleanedNum.length >= 10 && cleanedNum.length <= 13) {
        // Pakistani number (ensure it starts with +92)
        return `+${cleanedNum}`;
      } else if (cleanedNum.length === 10) {
        // US number (add +1)
        return `+1${cleanedNum}`;
      } else if (cleanedNum.length >= 11 && cleanedNum.length <= 15 && cleanedNum.startsWith("1")) {
        // US/Canada number with country code
        return `+${cleanedNum}`;
      } else if (cleanedNum.length >= 11 && cleanedNum.length <= 15 && cleanedNum.startsWith("92")) {
        // Pakistani number with country code
        return `+${cleanedNum}`;
      }

      return null; // Invalid number
    });

    const invalidNumbers = normalizedNumbers.filter((num) => !num);
    if (invalidNumbers.length > 0) {
      return NextResponse.json(
        { success: false, message: "Some phone numbers are invalid." },
        { status: 400 }
      );
    }

    const sendSmsPromises = normalizedNumbers.map((phoneNumber) => {
      
    if(phoneNumber){
      const command = new PublishCommand({
        Message: message,
        PhoneNumber: phoneNumber,
      });


      return snsClient.send(command);

    }
    
    });

    await Promise.all(sendSmsPromises);

    return NextResponse.json(
      { success: true, message: "SMS sent successfully to all numbers!" },
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


// const phoneRegex = /^\+?\d{10,15}$/;

// export const POST = async (req: Request) => {
//   try {
//     const { phoneNumbers, message } = await req.json();

//     if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
//       return NextResponse.json(
//         { success: false, message: "Invalid phone numbers array." },
//         { status: 400 }
//       );
//     }

//     // Normalize and Validate Phone Numbers
//     const normalizedNumbers = phoneNumbers.map((num) => {
//       let cleanedNum = num.replace(/\D/g, ""); // Remove all non-numeric characters

//       // If number doesn't start with a country code (assume US +1)
//       if (!/^1?\d{10,15}$/.test(cleanedNum)) {
//         return null; // Mark as invalid
//       }

//       // Ensure it starts with +
//       return cleanedNum.length === 10 ? `+1${cleanedNum}` : `+${cleanedNum}`;
//     });

//     const invalidNumbers = normalizedNumbers.filter((num) => !num);
//     if (invalidNumbers.length > 0) {
//       return NextResponse.json(
//         { success: false, message: "Some phone numbers are invalid." },
//         { status: 400 }
//       );
//     }

//     const sendSmsPromises = normalizedNumbers.map((phoneNumber) => {
//       const command = new PublishCommand({
//         Message: message,
//         PhoneNumber: phoneNumber,
//       });

//       return snsClient.send(command);
//     });

//     await Promise.all(sendSmsPromises);

//     return NextResponse.json(
//       { success: true, message: "SMS sent successfully to all numbers!" },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error("Error sending SMS:", error);
//     return NextResponse.json(
//       { message: error?.message || "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// };
