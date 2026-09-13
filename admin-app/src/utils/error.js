/**
 * Utility to extract safe, displayable error strings from Axios/Fetch error objects.
 * Prevents React crash: "Objects are not valid as a React child (found: object with keys {type, loc, msg, input})"
 */
export const getErrorMessage = (error, defaultMessage = 'An unexpected error occurred.') => {
  if (!error) return defaultMessage;

  if (typeof error === 'string') return error;

  const data = error.response?.data;
  if (data) {
    // If detail is a simple string
    if (typeof data.detail === 'string') {
      return data.detail;
    }

    // If detail is a FastAPI validation error array: [{loc, msg, type, input}]
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((err) => {
          if (typeof err === 'string') return err;
          const field = Array.isArray(err.loc) ? err.loc.filter((l) => l !== 'body').join('.') : '';
          return field ? `${field}: ${err.msg || err.type}` : err.msg || 'Invalid field';
        })
        .join(', ');
    }

    // If detail is a dictionary object
    if (typeof data.detail === 'object' && data.detail !== null) {
      return JSON.stringify(data.detail);
    }

    // Fallback to data.message
    if (typeof data.message === 'string') {
      return data.message;
    }
  }

  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  return defaultMessage;
};

export default getErrorMessage;
