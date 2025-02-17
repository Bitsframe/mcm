'use client';

import React from 'react';

const ThankYouPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50  p-8">
      {/* Header Section */}
      <div className='max-w-3xl'>
        <div className="mb-8">
          <img
            src="/assets/feedback_request_icon.png" 
            alt="MyClinic Logo"
            className="w-20"
          />
        </div>

        {/* Main Content */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          We Value Your Feedback – Help Us Improve!
        </h1>

        <p className="text-lg text-gray-700 mb-4">
          Dear <span className="font-semibold">Marco Barfield</span>,
        </p>

        <p className="text-gray-700 mb-4  max-w-xl">
          Thank you for choosing Clínica San Miguel! We hope you had a positive experience during your visit.
        </p>

        <p className="text-gray-700 mb-4  max-w-xl">
          As part of our commitment to continually improving our services, we would love to hear your thoughts on your recent purchase (Order ID: [Order ID]). Your feedback will help us serve you better in the future.
        </p>

        <p className="text-gray-700 mb-4  max-w-xl">
          Please take a moment to share your experience by filling out our quick feedback form: [Link to Feedback Form]
        </p>

        <p className="text-gray-700 mb-4  max-w-xl">
          We appreciate your time and look forward to serving you again.
        </p>

        <p className="text-gray-700 mb-6  max-w-xl">
          Warm regards,<br />
          Team,<br />
          Clínica San Miguel
        </p>

        {/* Footer */}
        <div className="mt-8 text-gray-600 ">
          Manage by MyClinicMD
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
