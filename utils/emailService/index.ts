import axios from 'axios';
import { classifyError, logError } from '@/utils/logging/safe-log';
import { emailBodyContent, EmailBodyInterface, EmailBodyTempEnum, emailFromDetails, getEmailTemplates } from './templateDetails';

export const sendEmail = async ({
  lang,
  emailType,
  data,
}: {
  lang: keyof typeof emailBodyContent;
  emailType: EmailBodyTempEnum;
  data: EmailBodyInterface;
}): Promise<void> => {
  try {
    const emailHtml = getEmailTemplates({ lang, emailType, data });

    const fromEmail = emailFromDetails[emailType];

    const payload = {
      from: `Clinica San Miguel <${fromEmail}>`,
      recipients: [data.email], 
      subject: emailBodyContent[lang][emailType].subject,
      html: emailHtml,
    };

    const endpoint = `${process.env.NEXT_PUBLIC_EMAIL_SENDER_URL}/send-batch-email`; 

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Email sent successfully:', response.data);
  } catch (error:any) {
    // Upstream mail bodies may echo the recipient; log the classification.
    logError('email.send_failed', {
      ...classifyError(error),
      status: error.response?.status,
    });
  }
};
