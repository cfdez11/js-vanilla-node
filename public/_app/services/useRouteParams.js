/**
 * Extracts dynamic route parameters from the current path.
 * 
 * This function matches the current URL against a set of predefined routes
 * that may contain dynamic segments indicated by the `:paramName` syntax.
 * It supports multiple dynamic parameters in a single route.
 *
 * @param {string} [currentPath=window.location.pathname] - The current URL path to parse.
 * @returns {Object} An object containing the key-value pairs of route parameters.
 *
 * Example:
 *  Routes: [{ path: '/users/:userId/:postId' }]
 *  Path: '/users/1/53'
 *  Returns: { userId: '1', postId: '53' }
 */
export function useRouteParams(currentPath = window.location.pathname) {
  try {
const pathParts = currentPath.split('/').filter(Boolean);

  for (const route of routes) {
    const routeParts = route.path.split('/').filter(Boolean);

    // Skip routes with a different number of segments
    if (routeParts.length !== pathParts.length) continue;

    const params = {};
    let isMatch = true;

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(':')) {
        // Extract parameter name and assign corresponding value from path
        const paramName = routePart.slice(1);
        params[paramName] = pathPart;
      } else if (routePart !== pathPart) {
        // If a static segment does not match, this route is not a match
        isMatch = false;
        break;
      }
    }

    // If a matching route is found, return the extracted parameters
    if (isMatch) return params;
  }

  // Return an empty object if no matching route is found
  return {};
  } catch(e) {
    console.error("useRouteParams error:", e);
    return {};
  }
}