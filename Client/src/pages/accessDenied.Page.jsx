import React from "react";

export default function AccessDeniedPage({ contactEmail = "support@yourdomain.com", returnUrl = "/" }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-2xl p-8 sm:p-12 text-center">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex items-center justify-center h-20 w-20 rounded-full bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 12.34a2.25 2.25 0 000 3.18l8.47 8.48a2.25 2.25 0 003.18 0l8.47-8.48a2.25 2.25 0 000-3.18L13.47 3.86a2.25 2.25 0 00-3.18 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-3">Access Removed</h1>

        <p className="text-gray-600 mb-6">
          Your access to this site has been removed. If you believe this is a mistake or need further assistance,
          please contact our support team.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center justify-center px-5 py-2 rounded-lg border border-transparent text-sm font-medium shadow-sm bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Contact support"
          >
            Contact Support
          </a>

          <a
            href={returnUrl}
            className="inline-flex items-center justify-center px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Return to home"
          >
            Return to homepage
          </a>
        </div>

        <small className="block text-gray-400 mt-6">If you were removed recently, changes may take up to a few minutes to propagate.</small>
      </div>
    </div>
  );
}
