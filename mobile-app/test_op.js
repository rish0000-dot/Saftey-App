const lat = 27.5330;
const lng = 77.6740;
const query = `[out:json];(nwr["amenity"~"police|hospital|clinic|mall|cafe|bank|pharmacy|university|college"](around:10000,${lat},${lng});nwr["tourism"~"hostel|hotel"](around:10000,${lat},${lng}););out center;`;

fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
  .then(r => {
    console.log("Status:", r.status);
    return r.text();
  })
  .then(text => {
    try {
      const data = JSON.parse(text);
      console.log("Elements:", data.elements?.length);
    } catch(e) {
      console.log("Response not JSON:", text.substring(0, 200));
    }
  })
  .catch(console.error);
