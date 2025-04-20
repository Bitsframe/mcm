export interface EmailBodyInterface {
  email: string;
  name: string;
  location: {
    title: string;
    address: string;
    phone: string;
  };
  service: string;
  date: string;
  time: string;

  oldDate?: string;
  oldTime?: string;
}

export enum EmailBodyTempEnum {
  APPOINTMENT_CONFIRMATION = "appointmentConfirmation",
  UPDATE_TO_YOUR_APPOINTMENT_DETAILS = 'updateToYourAppointmentDetails',
  CONFIRMATION_OF_FORM_SUBMISSION = 'confirmationOfFormSubmission'
}

export const emailFromDetails = {
  [EmailBodyTempEnum.APPOINTMENT_CONFIRMATION]: 'Appoinment@alerts.myclinicmd.com',
  [EmailBodyTempEnum.UPDATE_TO_YOUR_APPOINTMENT_DETAILS]: 'Appoinment@alerts.myclinicmd.com',
  [EmailBodyTempEnum.CONFIRMATION_OF_FORM_SUBMISSION]: 'POS@alerts.myclinicmd.com',
}

export interface EmailContent {
  subject: string;
  body: (data: EmailBodyInterface) => string;
}

export type EmailBodyContent = {
  [key: string]: {
    [key in EmailBodyTempEnum]: EmailContent;
  };
};

export const emailBodyContent: EmailBodyContent = {
  en: {
    [EmailBodyTempEnum.APPOINTMENT_CONFIRMATION]: {
      subject: "Appointment Confirmation - Clinica San Miguel",
      body: (data: EmailBodyInterface): string => {
        const { name, location, service, date, time } = data;
        return `
            <tbody>
              <tr>
                <td style="padding: 20px;">
                  <p>Dear <strong>${name}</strong>,</p>
                  <p>Thank you for choosing Clinica San Miguel. Your appointment request has been successfully received. Below are the details of your appointment:</p>
                  <ul style="list-style: none; padding: 0;">
                    <li>Location: <strong>${location.title}, ${location.address}</strong></li>
                    <li>Service: <strong>${service}</strong></li>
                    <li>Date: <strong>${date}</strong></li>
                    <li>Time: <strong>${time}</strong></li>
                  </ul>
                  <p>Our team looks forward to welcoming you and ensuring you receive the best care possible. If you have any questions or need to make changes to your appointment, please don’t hesitate to contact us at <a href="mailto:contact@clinicsanmiguel.com">contact@clinicsanmiguel.com</a> or at ${location.phone}.</p>
                  <p>Thank you for trusting us with your care.</p>
                  <p>Best regards,<br><strong>Clinica San Miguel Team</strong></p>
                </td>
              </tr>
            </tbody>`;
      },
    },
    [EmailBodyTempEnum.UPDATE_TO_YOUR_APPOINTMENT_DETAILS]: {
      subject: "Update to Your Appointment Details - Clinica San Miguel",
      body: (data: EmailBodyInterface): string => {
        const { name, location, service, date, time } = data;
        return `
            <tbody>
            <tr>
                <td style="padding: 20px;">
                    <p>Dear <strong>${name}</strong>,</p>
                    <p>Thank you for choosing Clinica San Miguel. Your appointment request has been successfully received. Below are the details of your appointment:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li>Location: <strong>${location.title}, ${location.address}</strong></li>
                        <li>Service: <strong>${service}</strong></li>
                        <li>Date: <strong>${date}</strong></li>
                        <li>Time: <strong>${time}</strong></li>
                    </ul>
                    <p>Our team looks forward to welcoming you and ensuring you receive the best care possible. If you have any questions or need to make changes to your appointment, please don’t hesitate to contact us at <a href="mailto:contact@clinicsanmiguel.com">contact@clinicsanmiguel.com</a> or at ${location.phone}.</p>
                    <p>Thank you for trusting us with your care.</p>
                    <p>Best regards,<br><strong>Clinica San Miguel Team</strong></p>
                </td>
            </tr>
          </tbody>`;
      },
    },
    [EmailBodyTempEnum.CONFIRMATION_OF_FORM_SUBMISSION]: {
      subject: "Appointment Confirmation - Clinica San Miguel",
      body: (data: EmailBodyInterface): string => {
        const { name, location, service, date, time } = data;
        return `
            <tbody>
          <tr>
            <td style="padding: 20px;">
              <p>Dear <strong>${name}</strong>,</p>
              <p>Thank you for choosing Clinica San Miguel. Your appointment request has been successfully received. Below are the details of your appointment:</p>
              <ul style="list-style: none; padding: 0;">
                <li>Location: <strong>${location.title}, ${location.address}</strong></li>
                <li>Service: <strong>${service}</strong></li>
                <li>Date: <strong>${date}</strong></li>
                <li>Time: <strong>${time}</strong></li>
              </ul>
              <p>Our team looks forward to welcoming you and ensuring you receive the best care possible. If you have any questions or need to make changes to your appointment, please don’t hesitate to contact us at <a href="mailto:contact@clinicsanmiguel.com">contact@clinicsanmiguel.com</a> or at ${location.phone}.</p>
              <p>Thank you for trusting us with your care.</p>
              <p>Best regards,<br><strong>Clinica San Miguel Team</strong></p>
            </td>
          </tr>
        </tbody>`;
      },
    },
  },
  es: {
    [EmailBodyTempEnum.APPOINTMENT_CONFIRMATION]: {
      subject: "Confirmación de Cita - Clinica San Miguel",
      body: (data: EmailBodyInterface): string => {
        const { name, location, service, date, time } = data;
        return `
          <tbody>
          <tr>
            <td style="padding: 20px;">
              <p>Estimado/a <strong>${name}</strong>,</p>
              <p>
                Gracias por elegir Clinica San Miguel. Su solicitud de cita ha sido recibida con éxito. A continuación, encontrará los detalles de su cita:
              </p>
              <ul style="list-style: none; padding: 0;">
                <li>Ubicación:<strong> ${location.title}, ${location.address}</strong></li>
                <li>Servicio:<strong> ${service}</strong></li>
                <li>Fecha:<strong> ${date}</strong></li>
                <li>Hora:<strong> ${time}</strong></li>
              </ul>
              <p>
                Nuestro equipo espera darle la bienvenida y garantizarle la mejor atención posible. 
                Si tiene alguna pregunta o necesita realizar cambios en su cita, no dude en contactarnos en 
                <a href="mailto:contact@clinicsanmiguel.com">contact@clinicsanmiguel.com</a> o al teléfono ${location.phone}.
              </p>
              <p>Gracias por confiar en nosotros para su cuidado.</p>
              <p>Atentamente,<br><strong>Equipo de Clinica San Miguel</strong></p>
            </td>
          </tr>
        </tbody>`;
      },
    },
    [EmailBodyTempEnum.UPDATE_TO_YOUR_APPOINTMENT_DETAILS]: {
      subject: "Actualización de su cita - Clinica San Miguel",
      body: (data: EmailBodyInterface): string => {
        const { name, location, service, date, time, oldDate, oldTime } = data;
        return `
          <tbody>
          <tr>
            <td style="padding: 20px;">
              <p>Estimado/a <strong>${name}</strong>,</p>
              <p>
                Le informamos que su cita en Clinica San Miguel ha sido actualizada. A continuación, encontrará los nuevos detalles de su cita:
              </p>
              <ul style="list-style: none; padding: 0;">
                <li>Fecha y Hora Anteriores:<strong> ${oldDate}</strong>  a las <strong>${oldTime}</strong></li>
                <li>Nueva Fecha y Hora:<strong> ${date}</strong> a las <strong> ${time}</strong></li>
                <li>Ubicación:<strong> ${location.title}, ${location.address}</strong></li>
                <li>Servicio:<strong> ${service}</strong> </li>
              </ul>
              <p>
                Lamentamos cualquier inconveniente que este cambio pueda causar y agradecemos su comprensión. 
                Si la nueva fecha o hora no le resulta conveniente, por favor contáctenos en 
                <a href="mailto:contact@clinicsanmiguel.com">contact@clinicsanmiguel.com</a> o al teléfono ${location.phone} 
                para reprogramar su cita en un momento que le sea más adecuado.
              </p>
              <p>
                Gracias por su paciencia y por confiar en Clinica San Miguel para su cuidado.
              </p>
              <p>Atentamente,<br><strong>Equipo de Clinica San Miguel</strong></p>
            </td>
          </tr>
        </tbody>`;
      },
    },
    [EmailBodyTempEnum.CONFIRMATION_OF_FORM_SUBMISSION]: {
      subject: "Confirmación de Cita - Clinica San Miguel",
      body: (data: EmailBodyInterface): string => {
        const { name, location, service } = data;
        return `
           <tbody>
          <tr>
            <td style="padding: 20px;">
              <p>Estimado/a <strong>${name}</strong>,</p>
              <p>
                Gracias por enviar su formulario en Clinica San Miguel. Nos complace informarle que su registro ha sido recibido y procesado correctamente en nuestro sistema POS.
              </p>
              <p>
                Servicio:<strong>${service}</strong> <br>
                Ubicación:<strong>${location.title} - ${location.address}</strong> 
              </p>
              <p>
                Si tiene alguna pregunta o necesita más asistencia, no dude en comunicarse con nosotros a 
                <a href="mailto:contact@clinicsanmiguel.com">contact@clinicsanmiguel.com</a> o al teléfono ${location.phone}.
              </p>
              <p>
                Gracias por elegirnos para sus necesidades de atención médica.
              </p>
              <p>Atentamente,<br><strong>El equipo de Clinica San Miguel</strong></p>
            </td>
          </tr>
        </tbody>`;
      },
    },
  },
};

export const getEmailTemplates = ({
  lang,
  emailType,
  data,
}: {
  lang: keyof typeof emailBodyContent;
  emailType: EmailBodyTempEnum;
  data: EmailBodyInterface;
}): string => {
  const emailContent = emailBodyContent[lang][emailType];
  const emailBody = emailContent.body(data);

  return `<!DOCTYPE html>
  <html lang="${lang}">
  
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailContent.subject}</title>
  </head>
  
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #ffff;">
    <table
      style="width: 100%; max-width: 800px; margin: 20px auto; background-color: #ffff; overflow: hidden;">
      <thead>
        <tr style="background-color: #ffff; text-align: center;">
          <th style="padding: 20px 0;">
            <img src="https://s3-alpha-sig.figma.com/img/ab61/d6d9/8fae1e02f5ed9616fd7c45a6867ca0cc?Expires=1736726400&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=hD339LqFecLfKadoOII-UpYGFyT6EgPlqyhgkQBkf8QZXRm-iy9-hyZeftTJXiIaNteKAesrGjoZ-bPwXl-d3hA0KCRS64x2WU3WVkYCNA53uNlltpLxf1xReC5fNi3BNVv11v-vNIdDxooWaDj37Tz5E9OMSuWMytXeGmWsUCrZHv0VRPmJXxwheauZQ4Uz0fS7z0XH~mbRDThi33sI6ePlaoHUBTp35hbsUaxzVT70XLkpO4rkjckfb5zRBo55VnakwtKIGnhbXAG331jOjvC1fbj4L7KDqYXJCOLAjN6mL4SXZPnjLJmfvtqXxaNaHk4xtwTqfOb4hsjpFm~rfQ__"
            alt="Clinica San Miguel" style="max-width: 250px;">
          </th>
        </tr>
      </thead>
      ${emailBody}
    </table>
  </body>
  
  </html>`;
};

