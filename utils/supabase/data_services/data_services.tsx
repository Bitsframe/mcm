import { supabase } from "@/services/supabase"

// data.js

interface SortOptions {
  column: string;
  order: 'asc' | 'desc';
}

interface MatchCase {
  key: string;
  value: string | number | boolean;
}

interface FetchContentServiceInterface {
  table: string;
  language?: string;
  selectParam?: string;
  matchCase?: MatchCase | MatchCase[] | null;
  sortOptions?: SortOptions | null;
  filterOptions?: { column: string; operator: string; value: any }[] | null;
}
interface UpdateContentServiceInterface {
  table: string;
  language?: string;
  post_data: any
  matchKey?: string;
}
interface CreateContentServiceInterface {
  table: string;
  language?: string;
  post_data: any
  multiple_rows?: boolean;
}
interface DeleteContentServiceInterface {
  table: string;
  language?: string;
  keyByDelete?: string;
  id: string | number;
}

export const getUserAllowedLocations = async (userId: string) => {
  try {
  const { data, error } = await supabase
  // @ts-ignore
      .from('user_locations')
      .select('location_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => item.location_id);
  } catch (error) {
    console.error('Error fetching user locations:', error);
    return [];
  }
};

export const fetchLocations = async (userId?: string) => {
  try {
    let query = supabase.from('Locations').select('*');
    
    // If userId is provided, only fetch locations allowed for that user
    if (userId) {
      const allowedLocationIds = await getUserAllowedLocations(userId);
      if (allowedLocationIds.length > 0) {
        query = query.in('id', allowedLocationIds);
      } else {
        return []; // Return empty array if user has no allowed locations
      }
  }

  const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

export const fetchApprovedAppointmentsByLocation = async (locationId: number) => {
  try {
    const { data, error } = await supabase
      .from('Appoinments')
      .select('*')
      .eq('location_id', locationId)
      .eq('isApproved', true);

    if (error) throw error;
  return data;
  } catch (error) {
    console.error('Error fetching approved appointments:', error);
    return [];
}
};

export const fetchUnapprovedAppointmentsByLocation = async (locationId: number) => {
  try {
    const { data, error } = await supabase
    .from('Appoinments')
      .select('*')
      .eq('location_id', locationId)
    .eq('isApproved', false); 

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching unapproved appointments:', error);
    return [];
}
};

export async function ApproveAppointment  (id: number) {
  const { data, error } = await supabase
    .from('Appoinments')
    .update({isApproved:true})
    .eq('id', id)
    .select('*')

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return data;
}


export async function fetch_content_service({
  table,
  language = '',
  selectParam = '',
  matchCase = null,
  sortOptions = null,
  filterOptions = null,
}: FetchContentServiceInterface) {

  let query = supabase
    //  @ts-ignore
    .from(`${table}${language}`)
    .select(`*${selectParam ? selectParam : ''}`);

  // Handle single or multiple match cases
  if (matchCase) {
    if (Array.isArray(matchCase)) {
      // Apply each filter in the array
      matchCase.forEach((condition) => {
        if(condition){
          query = query.eq(condition.key, condition.value,);
        }
        
      });
    } else {
      // Apply single match case
      query = query.eq(matchCase.key, matchCase.value);
    }
  }

  if (filterOptions) {
    filterOptions.forEach((filter) => {
      switch (filter.operator) {
        case 'gt':
          query = query.gt(filter.column, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.column, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.column, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.column, filter.value);
          break;
        case 'like':
          query = query.like(filter.column, filter.value);
          break;
        case 'ilike':
          query = query.ilike(filter.column, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.column, filter.value);
          break;
        case 'in':
          query = query.in(filter.column, filter.value);
          break;
        case 'not':
          query = query.not(filter.column, 'is', filter.value);
          break;
        default:
          console.warn(`Unknown operator: ${filter.operator}`);
      }
    })
  }

  if (sortOptions) {
    query = query.order(sortOptions.column, { ascending: sortOptions.order === 'asc' });
  }

  // query.limit(1, { foreignTable: 'products' });

  const { data, error } = await query;
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function update_content_service({ table, language = '', post_data, matchKey = 'id' }: UpdateContentServiceInterface) {
  // console.log({ language, post_data, section })
  const id = post_data[matchKey]
  delete post_data[matchKey]
  const { data, error } = await supabase
    //  @ts-ignore
    .from(`${table}${language}`)
    .update(post_data)
    .eq(matchKey, id)
    .select()
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return data;
}


export async function updateLocationData(id: number, post_data: any) {
  const { data, error } = await supabase
    .from(`Locations`)
    .update(post_data)
    .eq('id', id)
    .select()
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return data;
}



export async function create_content_service({ table, language = '', post_data, multiple_rows = false }: CreateContentServiceInterface) {

  let query = supabase
    //  @ts-ignore
    .from(`${table}${language}`)
    .insert(multiple_rows ? [...post_data] : [
      post_data
    ])
    .select()

  const { data, error } = await query;



  return { data, error }
}


export async function delete_appointment_service(id: number) {
  const query = await supabase
    .from('Appoinments')
    .delete()
    .eq('id', id)

  const { data, error } = await query;



  return { data, error }


}
export async function delete_content_service({ table, keyByDelete = 'id', id }: DeleteContentServiceInterface) {
  const query = await supabase
    // @ts-ignore
    .from(table)
    .delete()
    .eq(keyByDelete, id)

  const { data, error } = await query;



  return { data, error }
}



export async function update_appointment_service(id: number, value: string) {
  const query = await supabase
    .from('Appoinments')
    // @ts-ignore
    .update({ date_and_time: value })
    .eq('id', id)
    .select('*')




  const { data, error } = await query;



  return { data, error }
}


