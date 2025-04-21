import { FC } from "react"
import { PatientDetailsRenderPropsInterface } from "./types/interfaces"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"

export const PatientDetailsRender: FC<PatientDetailsRenderPropsInterface> = ({
  patientData,
  paymentType = "Cash",
}) => {
  const { t } = useTranslation(translationConstant.POSHISTORY)

  const {
    firstname = "",
    lastname = "",
    gender = "",
    email = "",
    phone = "",
    patientid,
    treatmenttype,
    Locations,
  } = patientData

  return (
    <div className="py-4 space-y-4">
      <h3 className="font-bold text-lg">{t("POS-Historyk12")}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
        <p>
          <span className="text-sm text-gray-500">{t("POS-Historyk13")}:</span><br />
          <strong>{patientid}</strong>
        </p>
        <p>
          <span className="text-sm text-gray-500">{t("POS-Historyk14")}:</span><br />
          <strong>{firstname} {lastname}</strong>
        </p>
        <p>
          <span className="text-sm text-gray-500">{t("POS-Historyk15")}:</span><br />
          <strong>{gender}</strong>
        </p>
        <p>
          <span className="text-sm text-gray-500">{t("POS-Historyk16")}:</span><br />
          <strong>{phone}</strong>
        </p>
        <p>
          <span className="text-sm text-gray-500">{t("POS-Historyk17")}:</span><br />
          <strong>{email}</strong>
        </p>
        <p>
          <span className="text-sm text-gray-500">{t("POS-Historyk18")}:</span><br />
          <strong>{paymentType}</strong>
        </p>
        <p>
          <span className="text-sm text-gray-500">{t("POS-Historyk19")}:</span><br />
          <strong>{treatmenttype}</strong>
        </p>
        <p>
          <span className="text-sm text-gray-500">{t("POS-Historyk20")}:</span><br />
          <strong>{Locations?.title}</strong>
        </p>
      </div>
    </div>
  )
}
