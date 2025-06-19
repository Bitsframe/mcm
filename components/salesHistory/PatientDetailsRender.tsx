import { FC, useState } from "react"
import { PatientDetailsRenderPropsInterface } from "./types/interfaces"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import axios from "axios"
import { toast } from "sonner"

export const PatientDetailsRender: FC<PatientDetailsRenderPropsInterface> = ({
  patientData,
  paymentType = "Cash",
  order_id,
}) => {
  const { t } = useTranslation(translationConstant.POSHISTORY)
  const [currentPaymentType, setCurrentPaymentType] = useState(paymentType)
  const [isUpdating, setIsUpdating] = useState(false)

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

  const handlePaymentTypeChange = async (newPaymentType: string) => {
    if (newPaymentType === currentPaymentType) return

    setIsUpdating(true)
    try {
      const response = await axios.put("/api/orders/update-payment", {
        order_id,
        paymentType: newPaymentType
      })

      if (response.data.success) {
        setCurrentPaymentType(newPaymentType)
        toast.success("Payment type updated successfully")
      } else {
        toast.error(response.data.message || "Failed to update payment type")
      }
    } catch (error: any) {
      console.error("Error updating payment type:", error)
      toast.error(error.response?.data?.message || "Failed to update payment type")
    } finally {
      setIsUpdating(false)
    }
  }

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
          <select
            value={currentPaymentType}
            onChange={(e) => handlePaymentTypeChange(e.target.value)}
            disabled={isUpdating}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="Cash">Cash</option>
            <option value="Debit">Debit</option>
          </select>
          {isUpdating && (
            <span className="text-xs text-blue-500 mt-1">Updating...</span>
          )}
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
