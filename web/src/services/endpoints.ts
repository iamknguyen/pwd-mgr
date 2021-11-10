export let ROOT_URL = '';
if (process.env.NODE_ENV === 'development') {
 ROOT_URL = 'http://localhost:8080';
} else {
  console.log('leaving default url', ROOT_URL)
}
export default {

}