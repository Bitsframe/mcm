import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import cliniclogo from "@/assets/images/Logos/Logo.png";
import * as React from "react";

interface KoalaWelcomeEmailProps {
  userFirstname?: string;
  reason?: string;
  clinicName?: string;
  name?: string;
  buttonText?: string;
  buttonLink?: string;
  endDate?: string;
  startDate?: string;
  price?:string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "";

export const  VercelInviteUserEmail = ({
  userFirstname,
  reason,
  clinicName,
  name,
  buttonText,
  buttonLink,
  startDate,
  endDate,
  price
}: KoalaWelcomeEmailProps) => (
  <>
      <div style={container}>
        <Img
          src={`https://firebasestorage.googleapis.com/v0/b/facebook-messenger-clone-df789.appspot.com/o/clinca_logo.png?alt=media&token=0bfc549b-f8a4-42b7-a627-1425dfa49978`}
          width="50"
          height="50"
          alt="Koala"
          style={logo}
        />
        <Text style={{...paragraph, color: "var(--text-color, #000000)"}}>Dear Patient,</Text>
        <Text style={{...paragraph, color: "var(--text-color, #000000)"}}>
        🍂October is the month to fight breast cancer! 💝Protect yourself! At Clínica San Miguel we give you the mammogram order for only ${price}. Don&#39;t wait any longer! It is without appointment.
        </Text>
        <Section style={btnContainer}>
       
        </Section>
        <Text style={{...paragraph, color: "var(--text-color, #000000)"}}>
          Best,
          <br />
          {name}
        </Text>
        <Hr style={hr} />
      </div>
  </>
);

VercelInviteUserEmail.PreviewProps = {
  userFirstname: "Alan",
} as KoalaWelcomeEmailProps;

export default  VercelInviteUserEmail;

const main = {
  backgroundColor: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  "@media (prefers-color-scheme: dark)": {
    backgroundColor: "#1a1a1a"
  }
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#000000", // Black for light mode
  "@media (prefers-color-scheme: dark)": {
    color: "#ffffff" // White for dark mode
  }
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#C1001F",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
  "@media (prefers-color-scheme: dark)": {
    borderColor: "#333333"
  }
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  "@media (prefers-color-scheme: dark)": {
    color: "#666666"
  }
};