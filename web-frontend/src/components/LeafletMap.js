// Backward compatibility wrapper redirecting to GoogleMap
import GoogleMap, { MapClickHandler } from './GoogleMap';

export const greenIcon = 'green';
export function makeNumberIcon(num) {
  return num;
}
export { MapClickHandler };
export default GoogleMap;
