const { useEffect, useState } = require("react");
import { LocationContext } from '@/context';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'
import axios from 'axios';
import { useContext } from 'react';



export function useCategoriesClinica(productsWithQuantity?: boolean) {
    const [categories, setCategories] = useState([])
    const { selectedLocation } = useContext(LocationContext);




    useEffect(() => {
        if (selectedLocation) {
          (async function fetchData(allCats = false, locationId) {
            try {
              let data = [];
      
              if (allCats) {
                const resData = await axios.get(`/api/products/category?locationId=${locationId}`);
                data = resData.data.data;
              } else {
                data = await fetch_content_service({ table: 'categories' });
              }
      
              setCategories(data);
            } catch (error) {
              console.error("Error fetching categories:", error);
              setCategories([]); 
            }
          })(productsWithQuantity, selectedLocation?.id);
        }
      }, [selectedLocation]);
      

    

    return { categories }
}