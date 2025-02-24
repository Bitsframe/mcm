import moment from "moment";

export function capitalize_word_letter(string: string) {
    const splited_string = string.split('_')
    const capitalized_string = splited_string.map(word => word.charAt(0).toUpperCase() + word.slice(1))
    return capitalized_string.join(' ')
}



export const currencyFormatHandle = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(amount)
};


export const renderFormattedDate = (date: any, currentFormat  : string = "DD-MM-YYYY") => {
  let formattedDate = '-'
  if(date){
    formattedDate = moment(date, currentFormat).format("MM-DD-YYYY")
  }
  return formattedDate
}