/**
 * Utility to safely extract a readable string error message from any API error.
 * Prevents React crash: "Objects are not valid as a React child (found: object with keys {type, loc, msg, input})"
 */
export function getApiErrorMessage(error) {
  if (!error) return 'An unexpected error occurred.';

  const detail = error?.response?.data?.detail;

  // Handle FastAPI 422 validation error array: [{type, loc, msg, input}, ...]
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        const loc = Array.isArray(item?.loc)
          ? item.loc.filter((p) => p !== 'body').join(' -> ')
          : '';
        const msg = item?.msg || 'Invalid input';
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join('; ');
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export default getApiErrorMessage;
