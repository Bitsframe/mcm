import { toast } from "react-toastify";

interface DataInterface {
  email: string;
  phone: string;
  state?: string;
  zipcode?: string;
  street_address?: string;
}

export const validateFormData = (data: DataInterface, address = false) => {
  const { email, phone, state, zipcode, street_address } = data;

  console.log("Validating Email:", email);
  console.log("Validating Phone:", phone);
  console.log("Address validation flag:", address);
  console.log("State:", state, "Zipcode:", zipcode, "Street Address:", street_address);

  // Ensure email is a string and clean up any unnecessary parts
  if (email) {
    const emailString = String(email).trim();
    console.log("Email before validation:", emailString);
    
    const isValidEmail = emailString.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

    console.log("Email Validation Result:", isValidEmail);

    if (!isValidEmail) {
      toast.error("Please enter a valid email");
      return false;
    }
  }

  // Ensure phone is a valid string
  if (phone) {
    const phoneString = String(phone).replace(/[^\d]/g, ""); // Remove non-numeric characters
    console.log("Phone before validation:", phoneString);
    
    const isValidPhone = phoneString.match(/^(\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/);

    console.log("Phone Validation Result:", isValidPhone);

    if (!isValidPhone) {
      toast.error("Please enter a valid phone number");
      return false;
    }
  }

  // Address validation
  if (address) {
    console.log("Validating Address Fields:", { state, zipcode, street_address });
    if (!state || !zipcode || !street_address) {
      toast.error("Please fill out all address fields");
      return false;
    }
  }

  return true;
};
