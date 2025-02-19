const { useEffect, useState } = require("react");
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'


export function useCategoriesClinica() {
    const [categories, setCategories] = useState([])

    useEffect(() => {
        !(async function fetch_data() {
            const data = await fetch_content_service({ table: 'categories' })
            setCategories(data);
        })()
    }, []);
    return { categories, }
}