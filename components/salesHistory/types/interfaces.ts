

export interface PreDefinedReasonListInterface {
    created_at: string;
    id: number;
    reason: string;

}
export interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderDetails: any;
    preDefinedReasonList: PreDefinedReasonListInterface[]
}

export interface PatientDetailsInterface {
    id: number;
    treatmenttype: string;
    firstname: string;
    lastname: string;
    gender: string;
    email: string;
    phone: string;
    Locations: {
        title: string
    }
}

export interface PatientDetailsRenderPropsInterface {
    patientData: PatientDetailsInterface;
    paymentType: string;
}


export interface DataListInterface {
    [key: string]: any; // This allows dynamic property access
}
