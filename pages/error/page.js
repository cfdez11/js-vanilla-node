export async function getData(errorData = {}) {
  return {
    error: {
      message: errorData.message || "Internal Server Error",
      code: errorData.code || 500,
      details: errorData.details || "No additional details provided.",
      timestamp: new Date().toLocaleString("en-US"),
      path: errorData.path || "Unknown path",
      stack: process.env.NODE_ENV === "development" ? errorData.stack : null,
    },
  };
}

export const metadata = {
  title: "Error - Vanilla JS",
  description: "An error has occurred in the application",
};
