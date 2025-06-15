'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useContext, useEffect, useState } from "react";
import { update_content_service, fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { CircularProgress } from "@mui/material";
import { LocationContext } from "@/context";
import { toast } from "sonner";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
interface LocationLimit {
  id: number;
  title: string;
  credit_limit: number;
  balance: number;
}

const LocationLimits = () => {
  const { t } = useTranslation(translationConstant.CONTROLS);
  const [updating, setUpdating] = useState<number | null>(null);
  const [newLimits, setNewLimits] = useState<{ [key: number]: number }>({});
  const [updatedLocations, setUpdatedLocations] = useState<LocationLimit[]>([]);
  const [refreshingBalance, setRefreshingBalance] = useState<number | null>(null);
  const { selectedLocation } = useContext(LocationContext);
  const { locations, update_loading: loading } = useLocationClinica();

  const fetchUpdatedLocation = async (locationId: number) => {
    try {
      const data = await fetch_content_service({
        table: "Locations",
        matchCase: { key: "id", value: locationId }
      });
      
      if (data && data.length > 0) {
        setUpdatedLocations(prev => 
          prev.map(loc => 
            loc.id === locationId ? data[0] : loc
          )
        );
      }
    } catch (error) {
      console.error("Error fetching updated location:", error);
    } finally {
      setRefreshingBalance(null);
    }
  };

  useEffect(() => {
    if (locations) {
      // Initialize newLimits with current credit limits
      const initialLimits = locations.reduce((acc: any, loc: LocationLimit) => {
        acc[loc.id] = loc.credit_limit;
        return acc;
      }, {});
      setNewLimits(initialLimits);
      setUpdatedLocations(locations);
    }
  }, [locations]);

  const handleLimitChange = (locationId: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setNewLimits(prev => ({
        ...prev,
        [locationId]: numValue
      }));
    }
  };

  const updateLocationLimit = async (locationId: number) => {
    try {
      setUpdating(locationId);
      const newLimit = newLimits[locationId];
      
      await update_content_service({
        table: "Locations",
        post_data: { 
          id: locationId,
          credit_limit: newLimit 
        }
      });

      // Update the local state to reflect the change immediately
      setUpdatedLocations(prev => 
        prev.map(loc => 
          loc.id === locationId 
            ? { ...loc, credit_limit: newLimit }
            : loc
        )
      );

      toast.success("Credit limit updated successfully");

      // Set refreshing state for balance
      setRefreshingBalance(locationId);

      // Wait for 2 seconds to allow trigger updates to complete
      setTimeout(() => {
        fetchUpdatedLocation(locationId);
      }, 2000);

    } catch (error: any) {
      console.error("Error updating location limit:", error);
      toast.error(error.message || "Failed to update credit limit");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-[80dvh]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("CT_k1")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="overflow-x-auto h-[70dvh]">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                  <TableRow>
                    <TableHead>{t("CT_k21")}</TableHead>
                    <TableHead>{t("CT_k22")}</TableHead>
                    <TableHead>{t("CT_k23")}</TableHead>
                    <TableHead>{t("CT_k24")}</TableHead>
                    <TableHead>{t("CT_k25")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {!updatedLocations || updatedLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <p className="text-gray-500 dark:text-gray-400">No locations found</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">There are no location records available.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    updatedLocations.map((location: LocationLimit) => (
                      <TableRow key={location.id}>
                        <TableCell>{location.title}</TableCell>
                        <TableCell>
                          {refreshingBalance === location.id ? (
                            <div className="flex items-center space-x-2">
                              <CircularProgress size={16} />
                              <span className="text-sm text-gray-500">Updating...</span>
                            </div>
                          ) : (
                            location.balance < 0 
                              ? `-$${Math.abs(location.balance).toFixed(2)}` 
                              : `$${location.balance.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>${location.credit_limit.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newLimits[location.id] || ''}
                            onChange={(e) => handleLimitChange(location.id, e.target.value)}
                            className="w-32"
                            placeholder="Enter new limit"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => updateLocationLimit(location.id)}
                            disabled={updating === location.id || newLimits[location.id] === location.credit_limit}
                            className="w-24"
                          >
                            {updating === location.id ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              t("CT_k26")
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default LocationLimits; 