import { toast } from "react-toastify";

interface DataInterface {
    email: string;
    phone: string;
    state?: string;
    zipcode?: string;
    street_address?: string;
}
const validateFormData = (data: DataInterface, address = false) => {
    const { email, phone, state, zipcode, street_address } = data;

    console.log("Validating Email:", email);
    console.log("Validating Phone:", phone);

    if (email) {
        const isValidEmail = String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );

        if (!isValidEmail) {
            toast.error(`Please enter a valid email`);
            return false;
        }
    }

    if (phone) {
        const isValidPhone = String(phone)
            .toLowerCase()
            .match(/^(\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/);
        if (!isValidPhone) {
            toast.error(`Please enter a valid phone number`);
            return false;
        }
    }

    if (address) {
        console.log("Validating Address Fields:", { state, zipcode, street_address });
        if (!state || !zipcode || !street_address) {
            toast.error("Please fill out all address fields");
            return false;
        }
    }

    return true;
}
