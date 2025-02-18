import moment from "moment";

// Format appointment date/time
export const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return "-";
  const [datePart, timePart] = dateTimeStr.split("|")[1]?.trim().split(" - ");
  return {
    date: moment(datePart, "DD-MM-YYYY").format("YYYY-MM-DD"),
    time: timePart,
  };
};

// Sort appointments
export const sortAppointments = (
  appointments: Appointment[],
  column: string,
  order: number
) => {
  const sortedList = [...appointments];

  switch (column) {
    case "gender":
      return sortedList.sort((a, b) =>
        order === 1 ? a.sex.localeCompare(b.sex) : b.sex.localeCompare(a.sex)
      );
    case "name":
      return sortedList.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`;
        const nameB = `${b.first_name} ${b.last_name}`;
        return order === 1 ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    case "service":
      return sortedList.sort((a, b) =>
        order === 1 ? a.service.localeCompare(b.service) : b.service.localeCompare(a.service)
      );
    default:
      return sortedList.sort((a, b) => {
        const timeA = moment(formatDateTime(a.date_and_time).date, "YYYY-MM-DD").valueOf();
        const timeB = moment(formatDateTime(b.date_and_time).date, "YYYY-MM-DD").valueOf();
        return order === -1 ? timeA - timeB : timeB - timeA;
      });
  }
};

// Filter appointments by selected date
export const filterAppointmentsByDate = (appointments: Appointment[], date: Date | null) => {
  if (!date) return appointments;
  const formattedDate = moment(date).format("YYYY-MM-DD");

  return appointments.filter((appoint) => {
    if (appoint.date_and_time) {
      const { date } = formatDateTime(appoint.date_and_time);
      return date === formattedDate;
    }
    return false;
  });
};
