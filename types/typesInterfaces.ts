export interface PromoCodeDataInterface {
    code: string;
    id: number

}


export interface CreateUserModalDataInterface {
    email: string;
    roleId: number;
    locationIds: number[];
    fullName:string
    password:string
    userType?: 'doctor' | 'staff' | null
}