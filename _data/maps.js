import EleventyFetch from "@11ty/eleventy-fetch";

export async function generateStaticMap(places, mapboxToken) {
  // Filter out places without coordinates
  const markers = places.filter(place => place.coordinates);
  if (markers.length === 0) return null;

  const width = 800;
  const height = 400;

  // Create marker overlay string
  const markerString = markers
    .map(place => `pin-s+FF0000(${place.coordinates.lng},${place.coordinates.lat})`)
    .join(',');

  let mapUrl;
  if (markers.length === 1) {
    // Single marker - use center and zoom
    const marker = markers[0];
    mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${markerString}/${marker.coordinates.lng},${marker.coordinates.lat},12/${width}x${height}?access_token=${mapboxToken}`;
  } else {
    // Multiple markers - use auto
    mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${markerString}/auto/${width}x${height}?padding=50&access_token=${mapboxToken}`;
  }

  try {
    const imageBuffer = await EleventyFetch(mapUrl, {
      duration: "1d",
      type: "buffer"
    });
    return { imageBuffer, width, height };
  } catch (error) {
    console.error("Error generating map:", error);
    return null;
  }
}
