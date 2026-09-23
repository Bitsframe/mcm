"use client"

import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"

interface ApprovedAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  onSave?: (data: { providerName: string; notes: string }) => void
}

const ApprovedAppointmentModal: React.FC<ApprovedAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSave,
}) => {
  const { t } = useTranslation(translationConstant.APPOINMENTS)
  const [providerName, setProviderName] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (isOpen && appointment) {
      // Reset form when modal opens
      setProviderName("")
      setNotes("")
    }
  }, [isOpen, appointment])

  const handleSave = () => {
    if (onSave) {
      onSave({ providerName, notes })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {appointment?.first_name} {appointment?.last_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Provider Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Name
            </label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="Enter provider name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter appointment notes"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-brand-500 hover:bg-brand-600 rounded-lg font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApprovedAppointmentModal
