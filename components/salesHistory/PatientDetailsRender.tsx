import { FC } from "react"
import { PatientDetailsRenderPropsInterface } from "./types/interfaces"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"

export const PatientDetailsRender: FC<PatientDetailsRenderPropsInterface> = ({ patientData, paymentType = 'Cash' }) => {

    const {t} = useTranslation(translationConstant.POSHISTORY)

    const { firstname = '', lastname = '', gender = '', email = '', phone = '', patientid, treatmenttype, Locations } = patientData
    return <div className="py-4 space-y-3">
        
        <div>
        <h3 className="font-bold">{t("POS-Historyk12")}</h3>
        </div>
        <div className="text-base grid grid-cols-3 gap-6">
            <p>{t("POS-Historyk13")}: <strong>{patientid}</strong> </p>
            <p>{t("POS-Historyk14")}: <strong>{firstname} {lastname}</strong> </p>
            <p>{t("POS-Historyk15")}: <strong>{gender}</strong> </p>
            <p>{t("POS-Historyk16")}: <strong>{phone}</strong></p>
            <p className=''>{t("POS-Historyk17")}: <strong>{email}</strong></p>
            <p className=''>{t("POS-Historyk18")}: <strong>{paymentType}</strong></p>
            <p>{t("POS-Historyk19")}: <strong>{treatmenttype}</strong></p>
            <p>{t("POS-Historyk20")}: <strong>{Locations?.title}</strong></p>
        </div>
    </div>
}
