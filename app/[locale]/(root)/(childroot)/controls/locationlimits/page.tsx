"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useContext, useEffect, useState } from "react"
import { update_content_service, fetch_content_service } from "@/utils/supabase/data_services/data_services"
import { CircularProgress } from "@mui/material"
import { LocationContext } from "@/context"
import { toast } from "sonner"
import { useLocationClinica } from "@/hooks/useLocationClinica"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"

interface LocationLimit {
  id: number
  title: string
  credit_limit: number
  balance: number
}

const LocationLimits = () => {
  const { t } = useTranslation(translationConstant.CONTROLS)
  const [updating, setUpdating] = useState<number | null>(null)
  const [newLimits, setNewLimits] = useState<{ [key: number]: number }>({})
  const [updatedLocations, setUpdatedLocations] = useState<LocationLimit[]>([])
  const [refreshingBalance, setRefreshingBalance] = useState<number | null>(null)
  const { selectedLocation } = useContext(LocationContext)
  const { locations, update_loading: loading } = useLocationClinica()

  const fetchUpdatedLocation = async (locationId: number) => {
    try {
      const data = await fetch_content_service({
        table: "Locations",
        matchCase: { key: "id", value: locationId },
      })
      if (data && data.length > 0) {
        setUpdatedLocations((prev) => prev.map((loc) => (loc.id === locationId ? data[0] : loc)))
      }
    } catch (error) {
      console.error("Error fetching updated location:", error)
    } finally {
      setRefreshingBalance(null)
    }
  }

  useEffect(() => {
    if (locations) {
      const initialLimits = locations.reduce((acc: any, loc: LocationLimit) => {
        acc[loc.id] = loc.credit_limit
        return acc
      }, {})
      setNewLimits(initialLimits)
      setUpdatedLocations(locations)
    }
  }, [locations])

  const handleLimitChange = (locationId: number, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setNewLimits((prev) => ({
        ...prev,
        [locationId]: numValue,
      }))
    }
  }

  const updateLocationLimit = async (locationId: number) => {
    try {
      setUpdating(locationId)
      const newLimit = newLimits[locationId]
      await update_content_service({
        table: "Locations",
        post_data: {
          id: locationId,
          credit_limit: newLimit,
        },
      })
      setUpdatedLocations((prev) =>
        prev.map((loc) => (loc.id === locationId ? { ...loc, credit_limit: newLimit } : loc)),
      )
      toast.success("Credit limit updated successfully")
      setRefreshingBalance(locationId)
      setTimeout(() => {
        fetchUpdatedLocation(locationId)
      }, 2000)
    } catch (error: any) {
      console.error("Error updating location limit:", error)
      toast.error(error.message || "Failed to update credit limit")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-[#0e1725]">
        <CircularProgress />
      </div>
    )
  }

  const formatBalance = (balance: number) => {
    return balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : `$${balance.toFixed(2)}`
  }

  return (
    <main className="flex-1 space-y-4 h-[80dvh] dark:bg-[#0e1725]">
      <Card className="w-full dark:bg-[#0e1725] dark:border-gray-700">
        <CardHeader className="dark:bg-[#0e1725]">
          <CardTitle className="dark:text-white">{t("CT_k1")}</CardTitle>
        </CardHeader>
        <CardContent className="dark:bg-[#0e1725]">
          <div className="hidden md:block">
            <div className="overflow-x-auto h-[55dvh] border rounded-lg dark:border-gray-700">
              <Table className="w-full table-fixed dark:bg-[#0e1725]">
                <TableHeader className="sticky top-0 bg-white dark:bg-[#0e1725] z-10">
                  <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                    <TableHead className="w-[25%] dark:text-white text-left px-4 py-3">{t("CT_k21")}</TableHead>
                    <TableHead className="w-[20%] dark:text-white text-left px-4 py-3">{t("CT_k22")}</TableHead>
                    <TableHead className="w-[20%] dark:text-white text-left px-4 py-3">{t("CT_k23")}</TableHead>
                    <TableHead className="w-[20%] dark:text-white text-left px-4 py-3">{t("CT_k24")}</TableHead>
                    <TableHead className="w-[15%] dark:text-white text-left px-4 py-3">{t("CT_k25")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="dark:bg-[#0e1725]">
                  {!updatedLocations || updatedLocations.length === 0 ? (
                    <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                      <TableCell colSpan={5} className="text-center py-8 dark:bg-[#0e1725] dark:text-white">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <p className="text-gray-500 dark:text-gray-400">No locations found</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            There are no location records available.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    updatedLocations.map((location: LocationLimit) => (
                      <TableRow
                        key={location.id}
                        className="hover:bg-transparent dark:hover:bg-transparent border-t dark:border-gray-700"
                      >
                        <TableCell className="w-[25%] dark:text-white px-4 py-3 truncate">{location.title}</TableCell>
                        <TableCell className="w-[20%] dark:text-white px-4 py-3">
                          {refreshingBalance === location.id ? (
                            <div className="flex items-center space-x-2">
                              <CircularProgress size={16} />
                              <span className="text-sm text-gray-500 dark:text-gray-400">Updating...</span>
                            </div>
                          ) : (
                            <span className="whitespace-nowrap">{formatBalance(location.balance)}</span>
                          )}
                        </TableCell>
                        <TableCell className="w-[20%] dark:text-white px-4 py-3">
                          <span className="whitespace-nowrap">${location.credit_limit.toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="w-[20%] px-4 py-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newLimits[location.id] || ""}
                            onChange={(e) => handleLimitChange(location.id, e.target.value)}
                            className="w-full max-w-[120px] dark:bg-[#1e293b] dark:border-gray-600 dark:text-white"
                            placeholder="Enter new limit"
                          />
                        </TableCell>
                        <TableCell className="w-[15%] px-4 py-3">
                          <Button
                            onClick={() => updateLocationLimit(location.id)}
                            disabled={updating === location.id || newLimits[location.id] === location.credit_limit}
                            className="w-full max-w-[80px] dark:bg-blue-600 dark:hover:bg-blue-700 text-xs"
                          >
                            {updating === location.id ? <CircularProgress size={16} color="inherit" /> : "Update"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="md:hidden space-y-4 dark:bg-[#0e1725]">
            {!updatedLocations || updatedLocations.length === 0 ? (
              <div className="text-center py-8 dark:bg-[#0e1725]">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-gray-500 dark:text-gray-400">No locations found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">There are no location records available.</p>
                </div>
              </div>
            ) : (
              updatedLocations.map((location: LocationLimit) => (
                <Card key={location.id} className="p-4 dark:bg-[#1e293b] dark:border-gray-700">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium dark:text-gray-300">{t("CT_k21")}</span>
                      <span className="dark:text-white">{location.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium dark:text-gray-300">{t("CT_k22")}</span>
                      {refreshingBalance === location.id ? (
                        <div className="flex items-center space-x-2">
                          <CircularProgress size={16} />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Updating...</span>
                        </div>
                      ) : (
                        <span className="dark:text-white">{formatBalance(location.balance)}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium dark:text-gray-300">{t("CT_k23")}</span>
                      <span className="dark:text-white">${location.credit_limit.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium dark:text-gray-300">{t("CT_k24")}</div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newLimits[location.id] || ""}
                        onChange={(e) => handleLimitChange(location.id, e.target.value)}
                        placeholder="Enter new limit"
                        className="dark:bg-[#0e1725] dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <Button
                      onClick={() => updateLocationLimit(location.id)}
                      disabled={updating === location.id || newLimits[location.id] === location.credit_limit}
                      className="w-full mt-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      {updating === location.id ? <CircularProgress size={20} color="inherit" /> : t("CT_k26")}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default LocationLimits
