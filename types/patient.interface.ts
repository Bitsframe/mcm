
interface DataListInterface {
    id: number;
    onsite: boolean;
    firstname: string;
    locationid: number;
    lastname: string;
    phone: string;
    email: string;
    treatmenttype: string;
    gender: string;
    created_at: string;
    lastvisit: string;
  }
  
  interface Props {
    renderType: 'all' | 'onsite' | 'offsite'
  }
  
  interface QueriesInterface {
    all: null,
    onsite: {
      key: string,
      value: boolean
    },
    offsite: {
      key: string,
      value: boolean
    },
  }