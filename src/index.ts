import rp = require('request-promise');
const api_key = process.env.TRAFIKLAB_API_KEY;

// Get a station ID given the name of a station
async function getLocationId(location: string): Promise<string> {
  const rawApiString = `https://api.resrobot.se/v2/location.name?key=${api_key}&format=json`
  const requestString = encodeURI(rawApiString + `&input=${location}`);
  const body = await rp(requestString).catch(console.error);
  const bodyJson = JSON.parse(body);
  const firstEntry = bodyJson.StopLocation[0];
  return firstEntry.id;
}

interface Stop {
  name: string;
  id: string;
  arr: Date | undefined;
  dep: Date | undefined;
}

interface Trip {
  operators: string[];
  stops: Stop[];
}

// Get all stops between origin and dest at specified times
// See notes.txt for notes on the API answer
async function getStops(orig: string, dest: string, depDate: string, depTime: string)
{
  const [origId, destId] = await Promise.all([getLocationId(orig), getLocationId(dest)]);
  const tripRequest = `https://api.resrobot.se/v2/trip?key=${api_key}&format=json` +
                      `&originId=${origId}` +
                      `&destId=${destId}` +
                      `&passlist=1` +
                      `&date=${depDate}` +
                      `&time=${depTime}` +
                      `&products=${2+4+16}`; // Snabbtåg + Regionaltåg + Lokaltåg

  // Extract the individual lines (legs) involved in the trip
  const tripBody = await rp(tripRequest).catch(console.error);
  const tripJson = JSON.parse(tripBody);
  let trainLegs = [];
  for (const leg of tripJson.Trip[0].LegList.Leg) {
    if (leg.type === "WALK")
      continue;
    trainLegs.push(leg);
  }

  // Create a list of Stops from the list of inviduvial lines
  let trip = {operators: new Array<string>(), stops: new Array<Stop>()};
  for (const leg of trainLegs) {
    trip.operators.push(leg.Product.operator);
    for (const stop of leg.Stops.Stop) {
      const arr = stop.arrTime ? new Date(`${stop.arrDate}T${stop.arrTime}`) : undefined;
      const dep = stop.depTime ? new Date(`${stop.depDate}T${stop.depTime}`) : undefined;
      trip.stops.push({name: stop.name, id: stop.id, arr: arr, dep: dep});
    }
  }
  return trip;
}


async function main() {
  const trip = await getStops("Umeå Östra", "Stockholm Central", "2019-08-30", "14:00").catch(console.error) as Trip;
  for (const stop of trip.stops) {
    console.log(stop);
  }
}


main().catch(console.error);
