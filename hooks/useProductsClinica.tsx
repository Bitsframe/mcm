const { useEffect, useState } = require("react");
import { LocationContext } from '@/context';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'
import { useContext } from 'react';

interface ProductDataInterface {
    category_id: number;
    price: number;
    product_id: number;
    product_name: string;
    quantity_available: number;

}


export function useProductsClinica(locationId?: number) {


    const [data, setdata] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(0)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [loading, setLoading] = useState(true)

    const { selectedLocation, setSelectedLocation } = useContext(LocationContext);


    const onChangeCategory = (cat_id: number) => {
        setSelectedCategory(cat_id)
        setSelectedProduct(0)
    }
    const onChangeProduct = (pro_id: number) => {
        const findProduct = data.find(({ product_id }: any) => product_id == pro_id)
        console.log(findProduct)
        setSelectedProduct(findProduct)
    }


    useEffect(() => {

        onChangeCategory(0)

    }, [selectedLocation])




    useEffect(() => {
        setLoading(true)

        if (selectedCategory) {
            !(async function fetch_data() {
                let matchCase = null
                if (selectedCategory) {
                    matchCase = [
                        {
                            key: 'products.category_id',
                            value: selectedCategory
                        },
                        {
                            key: 'location_id',
                            value: locationId || selectedLocation.id
                        },
                        {
                            key: 'archived',
                            value: false
                        },
                        {
                            key: 'products.archived',
                            value: false
                        }
                    ]
                }
                const data = await fetch_content_service({ table: 'inventory', matchCase: matchCase, selectParam: ',products(price,category_id, product_name,archived, unlimited)', filterOptions: [
                    { operator: 'not', column: 'products', value: null },
                    { operator: 'neq', column: 'products.price', value: 0 }
                    ] })
                const formattedData = data.filter((elem)=>elem.quantity > 0 || elem.products.unlimited && elem.products.price > 0).map(({ quantity, inventory_id, product_id,  products: { price, product_name, category_id, unlimited } }: any) => {
                    return {
                        product_id: inventory_id,
                        category_id,
                        product_name: product_name,
                        price,
                        quantity_available: quantity,
                        unlimited,
                        main_product_id: product_id,
                    }
                })

                setdata(formattedData);
                setLoading(false)
            })()
        }

    }, [selectedCategory]);



    return { products: data, getCategoriesByLocationId: onChangeCategory, loadingProducts: loading, selectedCategory, selectedProduct, selectProductHandle: onChangeProduct }



}